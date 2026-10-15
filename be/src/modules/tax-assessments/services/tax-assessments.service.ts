import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TaxAssessmentEntity } from '../entities/tax-assessment.entity';
import { CreateTaxAssessmentDto } from '../dto/create-tax-assessment.dto';
import { UpdateTaxAssessmentDto } from '../dto/update-tax-assessment.dto';
import {
  QueryTaxAssessmentDto,
  TaxAssessmentSortableField,
} from '../dto/query-tax-assessment.dto';
import { findEntityOrFail } from '../../../common/utils/find-or-fail.util';
import { TaxAssessmentStatusEnum } from '../../../common/enums/tax-assessment-status.enum';
import { VerificationStatusEnum } from '../../../common/enums/verification-status.enum';
import { SortOrder } from '../../../common/enums/sort-order.enum';
import { PropertyEntity } from '../../properties/entities/property.entity';
import { TaxCategoryEntity } from '../../tax-categories/entities/tax-category.entity';
import { TaxRulesService } from '../../tax-rules/tax-rules.service';
import { TaxCalculationService } from '../../tax-rules/tax-calculation.service';
import { AuditService } from '../../audit/audit.service';

const ALIAS = 'assessment';

@Injectable()
export class TaxAssessmentsService {
  constructor(
    @InjectRepository(TaxAssessmentEntity)
    private readonly repo: Repository<TaxAssessmentEntity>,
    @InjectRepository(PropertyEntity)
    private readonly propertyRepo: Repository<PropertyEntity>,
    @InjectRepository(TaxCategoryEntity)
    private readonly categoryRepo: Repository<TaxCategoryEntity>,
    private readonly rules: TaxRulesService,
    private readonly calc: TaxCalculationService,
    private readonly audit: AuditService,
  ) {}

  async create(
    dto: CreateTaxAssessmentDto,
    actorId?: string,
  ): Promise<TaxAssessmentEntity> {
    const category = await this.categoryRepo.findOne({
      where: { id: dto.taxCategoryId },
    });
    if (!category) {
      throw new BadRequestException('Tax category not found');
    }
    if (dto.propertyId) {
      const property = await this.propertyRepo.findOne({
        where: { id: dto.propertyId },
      });
      if (!property) throw new BadRequestException('Property not found');
      if (property.verificationStatus !== VerificationStatusEnum.VERIFIED) {
        throw new BadRequestException(
          'Only verified properties can enter the assessment workflow',
        );
      }
    }
    const periodLabel = dto.fiscalYear;
    const duplicate = await this.repo.findOne({
      where: {
        userId: dto.userId,
        taxCategoryId: dto.taxCategoryId,
        fiscalYear: dto.fiscalYear,
        periodLabel,
        ...(dto.propertyId ? { propertyId: dto.propertyId } : {}),
      },
    });
    if (duplicate) {
      throw new BadRequestException(
        `An assessment already exists for this subject and period (${duplicate.assessmentNumber})`,
      );
    }

    // Server-side calculation is authoritative; frontend-supplied amounts are
    // only a legacy fallback when no rule/inputs are available.
    let assessedValue = dto.assessedValue;
    let taxAmount = dto.taxAmount;
    let discount = dto.discount ?? 0;
    const penalty = dto.penalty ?? 0;
    let ruleId: string | undefined;
    let breakdown: Record<string, unknown> | undefined;
    const rule = await this.rules.findActiveRule(
      dto.taxCategoryId,
      dto.fiscalYear,
    );
    const inputs = (
      dto as unknown as { inputs?: Record<string, number | string> }
    ).inputs;
    if (rule && inputs) {
      const result = this.calc.calculate(
        category.code,
        { ...inputs, discount },
        rule,
      );
      assessedValue = result.baseAmount;
      taxAmount = result.principal;
      discount = result.breakdown.discount;
      ruleId = rule.id;
      breakdown = result.breakdown as unknown as Record<string, unknown>;
    }
    const totalDue = Math.max(
      0,
      Number((taxAmount - discount + penalty).toFixed(2)),
    );

    const entity = this.repo.create({
      ...dto,
      assessmentNumber: await this.generateAssessmentNumber(),
      assessedValue,
      taxAmount,
      discount,
      penalty,
      totalDue,
      status: TaxAssessmentStatusEnum.PENDING,
      amountPaid: 0,
      periodLabel,
      ruleId,
      calculationBreakdown: breakdown,
    });
    const saved = await this.repo.save(entity);
    await this.audit.record(
      'assessment.create',
      'tax-assessment',
      saved.id,
      {
        assessmentNumber: saved.assessmentNumber,
        ruleId,
      },
      actorId,
    );
    return saved;
  }

  async findAll(query: QueryTaxAssessmentDto) {
    const qb = this.buildQuery(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    qb.skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(
    id: string,
    requesterId?: string,
    staff = false,
  ): Promise<TaxAssessmentEntity> {
    const entity = await findEntityOrFail(
      this.repo,
      { id },
      'Tax Assessment',
      id,
    );
    if (!staff && requesterId && entity.userId !== requesterId) {
      throw new ForbiddenException(
        'You cannot view another citizen\u2019s assessment',
      );
    }
    return entity;
  }

  async findByUser(
    userId: string,
    requesterId?: string,
    staff = false,
  ): Promise<TaxAssessmentEntity[]> {
    if (!staff && requesterId && userId !== requesterId) {
      throw new ForbiddenException(
        'You cannot view another citizen\u2019s assessments',
      );
    }
    return this.repo.find({
      where: { userId },
      relations: { taxCategory: true, property: true },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    dto: UpdateTaxAssessmentDto,
    actorId?: string,
  ): Promise<TaxAssessmentEntity> {
    const entity = await findEntityOrFail(
      this.repo,
      { id },
      'Tax Assessment',
      id,
    );
    if (entity.isLocked) {
      throw new BadRequestException(
        'Issued assessments are immutable — use the bill amendment workflow',
      );
    }
    // Financial fields are recomputed server-side only; plain edits are
    // limited to notes/status metadata.
    const safe = { ...dto } as Record<string, unknown>;
    delete safe.taxAmount;
    delete safe.totalDue;
    delete safe.amountPaid;
    delete safe.discount;
    delete safe.penalty;
    delete safe.assessedValue;
    Object.assign(entity, safe);
    const saved = await this.repo.save(entity);
    await this.audit.record(
      'assessment.update',
      'tax-assessment',
      id,
      { ...safe },
      actorId,
    );
    return saved;
  }

  async updatePaymentStatus(
    id: string,
    amountPaid: number,
  ): Promise<TaxAssessmentEntity> {
    const entity = await findEntityOrFail(
      this.repo,
      { id },
      'Tax Assessment',
      id,
    );
    entity.amountPaid = amountPaid;
    if (amountPaid >= entity.totalDue) {
      entity.status = TaxAssessmentStatusEnum.PAID;
      entity.isLocked = true;
    } else if (amountPaid > 0) {
      entity.status = TaxAssessmentStatusEnum.PARTIALLY_PAID;
    }
    return this.repo.save(entity);
  }

  async remove(id: string): Promise<void> {
    const entity = await findEntityOrFail(
      this.repo,
      { id },
      'Tax Assessment',
      id,
    );
    if (entity.isLocked) {
      throw new BadRequestException('Locked assessments cannot be deleted');
    }
    await this.repo.softDelete(id);
  }

  async getOutstandingForUser(userId: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder(ALIAS)
      .select(
        `COALESCE(SUM(${ALIAS}.total_due - ${ALIAS}.amount_paid), 0)`,
        'total',
      )
      .where(`${ALIAS}.user_id = :userId`, { userId })
      .andWhere(`${ALIAS}.status IN (:...statuses)`, {
        statuses: [
          TaxAssessmentStatusEnum.PENDING,
          TaxAssessmentStatusEnum.PARTIALLY_PAID,
          TaxAssessmentStatusEnum.OVERDUE,
        ],
      })
      .getRawOne<{ total: string }>();
    return parseFloat(result?.total ?? '0');
  }

  async getPaidForUser(userId: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder(ALIAS)
      .select(`COALESCE(SUM(${ALIAS}.amount_paid), 0)`, 'total')
      .where(`${ALIAS}.user_id = :userId`, { userId })
      .andWhere(`${ALIAS}.status IN (:...statuses)`, {
        statuses: [
          TaxAssessmentStatusEnum.PAID,
          TaxAssessmentStatusEnum.PARTIALLY_PAID,
        ],
      })
      .getRawOne<{ total: string }>();
    return parseFloat(result?.total ?? '0');
  }

  async count(): Promise<number> {
    return this.repo.count();
  }

  async countPending(): Promise<number> {
    return this.repo.count({
      where: { status: TaxAssessmentStatusEnum.PENDING },
    });
  }

  private async generateAssessmentNumber(): Promise<string> {
    const count = await this.repo.count();
    return `TAX-${String(count + 1).padStart(6, '0')}`;
  }

  private buildQuery(
    query: QueryTaxAssessmentDto,
  ): SelectQueryBuilder<TaxAssessmentEntity> {
    const qb = this.repo.createQueryBuilder(ALIAS);
    qb.leftJoinAndSelect(`${ALIAS}.user`, 'user');
    qb.leftJoinAndSelect(`${ALIAS}.property`, 'property');
    qb.leftJoinAndSelect(`${ALIAS}.taxCategory`, 'taxCategory');
    if (query.search) {
      qb.andWhere(`${ALIAS}.assessment_number ILIKE :search`, {
        search: `%${query.search}%`,
      });
    }
    if (query.userId)
      qb.andWhere(`${ALIAS}.user_id = :userId`, { userId: query.userId });
    if (query.taxCategoryId) {
      qb.andWhere(`${ALIAS}.tax_category_id = :taxCategoryId`, {
        taxCategoryId: query.taxCategoryId,
      });
    }
    if (query.propertyId) {
      qb.andWhere(`${ALIAS}.property_id = :propertyId`, {
        propertyId: query.propertyId,
      });
    }
    if (query.status)
      qb.andWhere(`${ALIAS}.status = :status`, { status: query.status });
    if (query.fiscalYear) {
      qb.andWhere(`${ALIAS}.fiscal_year = :fiscalYear`, {
        fiscalYear: query.fiscalYear,
      });
    }
    const sortBy = query.sortBy ?? TaxAssessmentSortableField.CREATED_AT;
    const sortOrder = query.sortOrder ?? SortOrder.DESC;
    qb.orderBy(`${ALIAS}.${sortBy}`, sortOrder);
    return qb;
  }
}
