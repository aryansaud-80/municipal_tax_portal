import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FineAssessmentEntity } from './entities/fine-assessment.entity';
import { BillEntity } from '../bills/entities/bill.entity';
import { PenaltyBaseEnum } from '../../common/enums/penalty-base.enum';
import { BillStatusEnum } from '../../common/enums/bill-status.enum';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/services/notifications.service';
import { NotificationTypeEnum } from '../../common/enums/notification-type.enum';
import { fromPaisa, toPaisa } from '../../common/utils/money.util';

@Injectable()
export class FinesService {
  constructor(
    @InjectRepository(FineAssessmentEntity)
    private readonly repo: Repository<FineAssessmentEntity>,
    @InjectRepository(BillEntity)
    private readonly billRepo: Repository<BillEntity>,
    private readonly dataSource: DataSource,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Apply the configured percentage penalty to an overdue bill.
   * Idempotent per (bill, period): retries return the existing fine.
   */
  async applyToBill(
    billId: string,
    periodLabel: string,
    actorId = 'system',
  ): Promise<FineAssessmentEntity> {
    const existing = await this.repo.findOne({
      where: { billId, periodLabel, waived: false },
    });
    if (existing) return existing;

    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      const bill = await runner.manager.findOne(BillEntity, {
        where: { id: billId },
        relations: { rule: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!bill) throw new NotFoundException(`Bill '${billId}' not found`);
      if (
        ![
          BillStatusEnum.ISSUED,
          BillStatusEnum.PARTIALLY_PAID,
          BillStatusEnum.OVERDUE,
        ].includes(bill.status)
      ) {
        throw new BadRequestException(
          'Penalties apply only to unpaid overdue bills',
        );
      }
      const today = new Date().toISOString().slice(0, 10);
      const graceUntil = bill.rule?.graceDays
        ? new Date(
            new Date(bill.dueDate).getTime() + bill.rule.graceDays * 86400000,
          )
            .toISOString()
            .slice(0, 10)
        : bill.dueDate;
      if (today <= graceUntil) {
        throw new BadRequestException(
          'Bill is not yet overdue (grace period applies)',
        );
      }
      const percent = Number(bill.rule?.penaltyPercent ?? 0);
      if (!(percent > 0)) {
        throw new BadRequestException(
          'No penalty percentage configured for this bill\u2019s rule',
        );
      }
      const base: PenaltyBaseEnum =
        bill.rule?.penaltyBase ?? PenaltyBaseEnum.OUTSTANDING;
      // Explicit policy: 'principal' uses the bill principal; 'outstanding'
      // uses the remaining balance. Stored on every fine for auditability.
      const baseAmount =
        base === PenaltyBaseEnum.PRINCIPAL
          ? Number(bill.principal)
          : fromPaisa(toPaisa(bill.totalPayable) - toPaisa(bill.amountPaid));
      if (toPaisa(baseAmount) <= 0) {
        throw new BadRequestException('Nothing outstanding to penalize');
      }
      const amount = fromPaisa(
        Math.round((toPaisa(baseAmount) * percent) / 100),
      );
      const count = await runner.manager.count(FineAssessmentEntity);
      const fine = await runner.manager.save(
        runner.manager.create(FineAssessmentEntity, {
          fineNumber: `FINE-${String(count + 1).padStart(6, '0')}`,
          billId,
          ruleId: bill.ruleId,
          baseAmount,
          penaltyBase: base,
          percent,
          amount,
          assessedDate: today,
          periodLabel,
          assessedBy: actorId,
        }),
      );
      bill.penalty = fromPaisa(toPaisa(bill.penalty) + toPaisa(amount));
      bill.totalPayable = fromPaisa(
        toPaisa(bill.principal) +
          toPaisa(bill.penalty) -
          toPaisa(bill.discount),
      );
      if (bill.status !== BillStatusEnum.PARTIALLY_PAID)
        bill.status = BillStatusEnum.OVERDUE;
      bill.calculationBreakdown = {
        ...bill.calculationBreakdown,
        penalty: bill.penalty,
        totalPayable: bill.totalPayable,
      };
      await runner.manager.save(bill);
      await runner.commitTransaction();
      await this.audit.record(
        'fine.apply',
        'fine',
        fine.id,
        {
          billId,
          percent,
          base,
          amount,
        },
        actorId === 'system' ? undefined : actorId,
      );
      await this.notifications.create({
        userId: bill.userId,
        title: 'Late-payment penalty applied',
        message: `Bill ${bill.billNumber}: ${percent}% penalty of NPR ${amount} applied.`,
        type: NotificationTypeEnum.WARNING,
        link: '/taxes',
      });
      return fine;
    } catch (error) {
      await runner.rollbackTransaction();
      if ((error as { code?: string })?.code === '23505') {
        const dup = await this.repo.findOne({ where: { billId, periodLabel } });
        if (dup) return dup;
      }
      throw error;
    } finally {
      await runner.release();
    }
  }

  async waive(
    id: string,
    reason: string,
    actorId: string,
  ): Promise<FineAssessmentEntity> {
    if (!reason || reason.trim().length < 5) {
      throw new BadRequestException(
        'A waiver reason (min 5 chars) is required',
      );
    }
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      const fine = await runner.manager.findOne(FineAssessmentEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!fine) throw new NotFoundException(`Fine '${id}' not found`);
      if (fine.waived) throw new BadRequestException('Fine is already waived');
      fine.waived = true;
      fine.waiverReason = reason;
      fine.waivedBy = actorId;
      fine.waivedAt = new Date();
      await runner.manager.save(fine);
      const bill = await runner.manager.findOne(BillEntity, {
        where: { id: fine.billId },
        lock: { mode: 'pessimistic_write' },
      });
      if (bill) {
        bill.penalty = fromPaisa(
          Math.max(0, toPaisa(bill.penalty) - toPaisa(fine.amount)),
        );
        bill.totalPayable = fromPaisa(
          toPaisa(bill.principal) +
            toPaisa(bill.penalty) -
            toPaisa(bill.discount),
        );
        await runner.manager.save(bill);
      }
      await runner.commitTransaction();
      await this.audit.record('fine.waive', 'fine', id, { reason }, actorId);
      return fine;
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }

  async findForBill(billId: string): Promise<FineAssessmentEntity[]> {
    return this.repo.find({ where: { billId }, order: { createdAt: 'DESC' } });
  }

  async findAll(query: { page?: number; limit?: number; waived?: boolean }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 100);
    const where: Record<string, unknown> = {};
    if (query.waived !== undefined) where.waived = query.waived;
    const [data, total] = await this.repo.findAndCount({
      where,
      relations: { bill: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
