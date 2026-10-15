import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BillEntity } from './entities/bill.entity';
import { BillStatusEnum } from '../../common/enums/bill-status.enum';
import { BillingPeriodEnum } from '../../common/enums/billing-period.enum';
import { VerificationStatusEnum } from '../../common/enums/verification-status.enum';
import { TaxCategoryCodeEnum } from '../../common/enums/tax-category-code.enum';
import { PropertyEntity } from '../properties/entities/property.entity';
import { TaxCategoryEntity } from '../tax-categories/entities/tax-category.entity';
import { TaxAssessmentEntity } from '../tax-assessments/entities/tax-assessment.entity';
import { TaxRulesService } from '../tax-rules/tax-rules.service';
import {
  TaxCalculationService,
  AssessmentInputs,
} from '../tax-rules/tax-calculation.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/services/notifications.service';
import { NotificationTypeEnum } from '../../common/enums/notification-type.enum';
import {
  AmendBillDto,
  BulkIssueDto,
  CancelBillDto,
  CreateBillDto,
} from './dto/bill.dto';
import { fromPaisa, roundNpr, toPaisa } from '../../common/utils/money.util';

const PROPERTY_BOUND = new Set([
  TaxCategoryCodeEnum.PROPERTY_TAX,
  TaxCategoryCodeEnum.LAND_TAX,
]);

interface IssueResult {
  bill: BillEntity;
  created: boolean;
}

@Injectable()
export class BillsService {
  constructor(
    @InjectRepository(BillEntity)
    private readonly repo: Repository<BillEntity>,
    @InjectRepository(PropertyEntity)
    private readonly propertyRepo: Repository<PropertyEntity>,
    @InjectRepository(TaxCategoryEntity)
    private readonly categoryRepo: Repository<TaxCategoryEntity>,
    @InjectRepository(TaxAssessmentEntity)
    private readonly assessmentRepo: Repository<TaxAssessmentEntity>,
    private readonly rules: TaxRulesService,
    private readonly calc: TaxCalculationService,
    private readonly dataSource: DataSource,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async issue(dto: CreateBillDto, issuedBy: string): Promise<BillEntity> {
    const { bill, created } = await this.issueOne(dto, issuedBy);
    if (!created) {
      throw new BadRequestException(
        `A bill already exists for this subject and period (${bill.billNumber})`,
      );
    }
    return bill;
  }

  async bulkIssue(dto: BulkIssueDto, issuedBy: string) {
    const category = await this.requireCategory(dto.taxCategoryId);
    const targets = await this.resolveTargets(category.code, dto);
    const issued: BillEntity[] = [];
    const skipped: Array<{ subject: string; reason: string }> = [];

    for (const target of targets) {
      try {
        const { bill, created } = await this.issueOne(
          {
            taxCategoryId: dto.taxCategoryId,
            userId: target.userId,
            propertyId: target.propertyId,
            fiscalYear: dto.fiscalYear,
            periodLabel: dto.periodLabel,
            inputs:
              (dto.inputs?.[target.key] as Record<string, number | string>) ??
              target.inputs,
          },
          issuedBy,
        );
        if (created) issued.push(bill);
        else
          skipped.push({
            subject: target.key,
            reason: `Duplicate — existing ${bill.billNumber}`,
          });
      } catch (error) {
        skipped.push({
          subject: target.key,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    await this.audit.record(
      'bill.bulk-issue',
      'bill',
      undefined,
      {
        category: category.code,
        fiscalYear: dto.fiscalYear,
        issued: issued.length,
        skipped: skipped.length,
      },
      issuedBy,
    );
    return {
      issued,
      skipped,
      summary: { issued: issued.length, skipped: skipped.length },
    };
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    userId?: string;
    status?: BillStatusEnum;
    fiscalYear?: string;
    taxCategoryId?: string;
    overdueOnly?: boolean;
  }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 100);
    const qb = this.repo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.taxCategory', 'c')
      .leftJoinAndSelect('b.user', 'u')
      .leftJoinAndSelect('b.property', 'p')
      .orderBy('b.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (query.userId) qb.andWhere('b.userId = :uid', { uid: query.userId });
    if (query.status)
      qb.andWhere('b.status = :status', { status: query.status });
    if (query.fiscalYear)
      qb.andWhere('b.fiscalYear = :fy', { fy: query.fiscalYear });
    if (query.taxCategoryId)
      qb.andWhere('b.taxCategoryId = :cat', { cat: query.taxCategoryId });
    if (query.overdueOnly)
      qb.andWhere('b.dueDate < CURRENT_DATE').andWhere('b.status IN (:...s)', {
        s: [
          BillStatusEnum.ISSUED,
          BillStatusEnum.PARTIALLY_PAID,
          BillStatusEnum.OVERDUE,
        ],
      });
    const [data, total] = await qb.getManyAndCount();
    return {
      data: data.map((b) => this.sanitize(b)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(
    id: string,
    requesterId?: string,
    staff = false,
  ): Promise<BillEntity> {
    const bill = await this.repo.findOne({
      where: { id },
      relations: { taxCategory: true, property: true, user: true, rule: true },
    });
    if (!bill) throw new NotFoundException(`Bill '${id}' not found`);
    if (!staff && requesterId && bill.userId !== requesterId) {
      throw new ForbiddenException(
        'You cannot view another citizen\u2019s bill',
      );
    }
    return this.sanitize(bill);
  }

  async findMine(userId: string): Promise<BillEntity[]> {
    const bills = await this.repo.find({
      where: { userId },
      relations: { taxCategory: true, property: true, rule: true },
      order: { createdAt: 'DESC' },
    });
    return bills.map((b) => this.sanitize(b));
  }

  /** Authorized, auditable amendment: supersedes the issued bill with a new version. */
  async amend(
    id: string,
    dto: AmendBillDto,
    actorId: string,
  ): Promise<BillEntity> {
    if (!dto.reason || dto.reason.trim().length < 5) {
      throw new BadRequestException(
        'An amendment reason (min 5 chars) is required',
      );
    }
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      const old = await runner.manager.findOne(BillEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!old) throw new NotFoundException(`Bill '${id}' not found`);
      if (old.status === BillStatusEnum.PAID) {
        throw new BadRequestException(
          'Paid bills cannot be amended — issue a reversal instead',
        );
      }
      if (
        old.status === BillStatusEnum.VOID ||
        old.status === BillStatusEnum.CANCELLED
      ) {
        throw new BadRequestException(
          'This bill has already been superseded or cancelled',
        );
      }
      const adjustments = dto.adjustments ?? [];
      const adjTotal = adjustments.reduce((s, a) => s + toPaisa(a.amount), 0);
      const principal = fromPaisa(toPaisa(old.principal) + adjTotal);
      if (toPaisa(principal) < 0) {
        throw new BadRequestException(
          'Adjustments cannot make the principal negative',
        );
      }
      const discount = roundNpr(dto.discount ?? old.discount);
      const totalPayable = fromPaisa(
        toPaisa(principal) + toPaisa(old.penalty) - toPaisa(discount),
      );
      const count = await runner.manager.count(BillEntity);
      const next = runner.manager.create(BillEntity, {
        billNumber: `BILL-${String(count + 1).padStart(6, '0')}-V${old.version + 1}`,
        assessmentId: old.assessmentId,
        userId: old.userId,
        propertyId: old.propertyId,
        taxCategoryId: old.taxCategoryId,
        ruleId: old.ruleId,
        fiscalYear: old.fiscalYear,
        billingPeriod: old.billingPeriod,
        periodLabel: old.periodLabel,
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: old.dueDate,
        principal,
        discount,
        penalty: old.penalty,
        totalPayable,
        amountPaid: old.amountPaid,
        status:
          toPaisa(old.amountPaid) > 0
            ? BillStatusEnum.PARTIALLY_PAID
            : BillStatusEnum.ISSUED,
        calculationBreakdown: {
          ...(old.calculationBreakdown as object),
          adjustments,
          amendmentReason: dto.reason,
          supersedes: old.billNumber,
        },
        version: old.version + 1,
        supersedesBillId: old.id,
        issuedBy: actorId,
      });
      const saved = await runner.manager.save(next);
      old.status = BillStatusEnum.VOID;
      old.cancelledReason = `Superseded by ${saved.billNumber}: ${dto.reason}`;
      await runner.manager.save(old);
      await runner.commitTransaction();
      await this.audit.record(
        'bill.amend',
        'bill',
        saved.id,
        {
          from: old.billNumber,
          to: saved.billNumber,
          reason: dto.reason,
          adjustments,
        },
        actorId,
      );
      return saved;
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }

  async cancel(
    id: string,
    dto: CancelBillDto,
    actorId: string,
  ): Promise<BillEntity> {
    if (!dto.reason || dto.reason.trim().length < 5) {
      throw new BadRequestException(
        'A cancellation reason (min 5 chars) is required',
      );
    }
    const bill = await this.repo.findOne({ where: { id } });
    if (!bill) throw new NotFoundException(`Bill '${id}' not found`);
    if (bill.status === BillStatusEnum.PAID) {
      throw new BadRequestException('Paid bills cannot be cancelled');
    }
    bill.status = BillStatusEnum.CANCELLED;
    bill.cancelledReason = dto.reason;
    const saved = await this.repo.save(bill);
    await this.audit.record(
      'bill.cancel',
      'bill',
      id,
      { reason: dto.reason },
      actorId,
    );
    return saved;
  }

  /** Nightly-safe overdue sweep: idempotent, only flips status. */
  async markOverdue(): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .update(BillEntity)
      .set({ status: BillStatusEnum.OVERDUE })
      .where('due_date < CURRENT_DATE')
      .andWhere('status IN (:...s)', {
        s: [BillStatusEnum.ISSUED, BillStatusEnum.PARTIALLY_PAID],
      })
      .execute();
    return result.affected ?? 0;
  }

  private async issueOne(
    dto: CreateBillDto,
    issuedBy: string,
  ): Promise<IssueResult> {
    const category = await this.requireCategory(dto.taxCategoryId);
    const rule = await this.rules.findActiveRule(
      dto.taxCategoryId,
      dto.fiscalYear,
    );
    if (!rule) {
      throw new BadRequestException(
        `No active tax rule for ${category.name} in fiscal year ${dto.fiscalYear}`,
      );
    }
    let property: PropertyEntity | null = null;
    if (dto.propertyId) {
      property = await this.propertyRepo.findOne({
        where: { id: dto.propertyId },
      });
      if (!property) throw new NotFoundException('Property not found');
      if (property.verificationStatus !== VerificationStatusEnum.VERIFIED) {
        throw new BadRequestException(
          'Only verified properties can enter the assessment workflow',
        );
      }
    } else if (PROPERTY_BOUND.has(category.code)) {
      throw new BadRequestException(
        `${category.name} requires a verified property`,
      );
    }
    const userId = dto.userId ?? property?.userId;
    if (!userId)
      throw new BadRequestException('A taxpayer (userId) is required');
    const billingPeriod = dto.billingPeriod ?? rule.billingPeriod;
    const periodLabel =
      dto.periodLabel ?? this.defaultPeriodLabel(dto.fiscalYear, billingPeriod);

    const existing = await this.repo.findOne({
      where: {
        taxCategoryId: dto.taxCategoryId,
        fiscalYear: dto.fiscalYear,
        periodLabel,
        ...(property ? { propertyId: property.id } : { userId }),
      },
    });
    if (existing) return { bill: existing, created: false };

    const calc = this.calc.calculate(
      category.code,
      { ...(dto.inputs as AssessmentInputs), discount: dto.discount ?? 0 },
      rule,
    );
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      const doubleCheck = await runner.manager.findOne(BillEntity, {
        where: {
          taxCategoryId: dto.taxCategoryId,
          fiscalYear: dto.fiscalYear,
          periodLabel,
          ...(property ? { propertyId: property.id } : { userId }),
        },
        lock: { mode: 'pessimistic_write' },
      });
      if (doubleCheck) {
        await runner.rollbackTransaction();
        return { bill: doubleCheck, created: false };
      }
      // Double-check inside txn for non-property categories too.
      const count = await runner.manager.count(BillEntity);
      const issueDate = dto.issueDate ?? new Date().toISOString().slice(0, 10);
      const dueDate =
        dto.dueDate ?? rule.dueDate ?? this.defaultDueDate(issueDate);
      const bill = await runner.manager.save(
        runner.manager.create(BillEntity, {
          billNumber: `BILL-${String(count + 1).padStart(6, '0')}`,
          userId,
          propertyId: property?.id,
          taxCategoryId: dto.taxCategoryId,
          ruleId: rule.id,
          fiscalYear: dto.fiscalYear,
          billingPeriod,
          periodLabel,
          issueDate,
          dueDate,
          principal: calc.principal,
          discount: calc.breakdown.discount,
          penalty: 0,
          totalPayable: calc.breakdown.totalPayable,
          amountPaid: 0,
          status: BillStatusEnum.ISSUED,
          calculationBreakdown: calc.breakdown,
          issuedBy,
        }),
      );
      await runner.commitTransaction();
      await this.audit.record(
        'bill.issue',
        'bill',
        bill.id,
        {
          billNumber: bill.billNumber,
          principal: bill.principal,
        },
        issuedBy,
      );
      await this.notifications.create({
        userId,
        title: `New ${category.name} bill issued`,
        message: `Bill ${bill.billNumber} for ${periodLabel} — NPR ${bill.totalPayable}. Due ${bill.dueDate}.`,
        type: NotificationTypeEnum.INFO,
        link: '/taxes',
      });
      return { bill, created: true };
    } catch (error) {
      await runner.rollbackTransaction();
      // Unique-violation on retry → treat as duplicate, not a crash.
      if ((error as { code?: string })?.code === '23505') {
        const dup = await this.repo.findOne({
          where: {
            taxCategoryId: dto.taxCategoryId,
            fiscalYear: dto.fiscalYear,
            periodLabel,
            ...(property ? { propertyId: property.id } : { userId }),
          },
        });
        if (dup) return { bill: dup, created: false };
      }
      throw error;
    } finally {
      await runner.release();
    }
  }

  private async requireCategory(id: string): Promise<TaxCategoryEntity> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Tax category not found');
    if (!category.isActive)
      throw new BadRequestException('Tax category is inactive');
    return category;
  }

  private async resolveTargets(
    code: TaxCategoryCodeEnum,
    dto: BulkIssueDto,
  ): Promise<
    Array<{
      key: string;
      userId: string;
      propertyId?: string;
      inputs: Record<string, number | string>;
    }>
  > {
    if (dto.propertyIds?.length) {
      const props = await this.propertyRepo
        .createQueryBuilder('p')
        .where('p.id IN (:...ids)', { ids: dto.propertyIds })
        .andWhere('p.verificationStatus = :v', {
          v: VerificationStatusEnum.VERIFIED,
        })
        .getMany();
      return props.map((p) => ({
        key: p.propertyNumber,
        userId: p.userId,
        propertyId: p.id,
        inputs: {},
      }));
    }
    if (PROPERTY_BOUND.has(code)) {
      const qb = this.propertyRepo
        .createQueryBuilder('p')
        .where('p.verificationStatus = :v', {
          v: VerificationStatusEnum.VERIFIED,
        });
      if (dto.ward) qb.andWhere('p.ward = :ward', { ward: dto.ward });
      const props = await qb.getMany();
      return props.map((p) => ({
        key: p.propertyNumber,
        userId: p.userId,
        propertyId: p.id,
        inputs: {},
      }));
    }
    // Non-property categories: bulk over explicit user list is out of scope;
    // require explicit per-subject inputs keyed by user id via propertyIds misuse guard.
    throw new BadRequestException(
      'Bulk issuance for non-property taxes requires explicit propertyIds of verified business/ad records in this version',
    );
  }

  private defaultPeriodLabel(
    fiscalYear: string,
    period: BillingPeriodEnum,
  ): string {
    if (period === BillingPeriodEnum.MONTHLY) {
      return `${fiscalYear}-${new Date().toISOString().slice(0, 7)}`;
    }
    return fiscalYear;
  }

  private defaultDueDate(issueDate: string): string {
    const d = new Date(issueDate);
    d.setDate(d.getDate() + 35);
    return d.toISOString().slice(0, 10);
  }

  private sanitize(bill: BillEntity): BillEntity {
    if (bill.user) {
      const user = bill.user as unknown as Record<string, unknown>;
      delete user.passwordHash;
    }
    return bill;
  }
}
