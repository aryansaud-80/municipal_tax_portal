import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillEntity } from '../bills/entities/bill.entity';
import { BillStatusEnum } from '../../common/enums/bill-status.enum';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { PaymentStatusEnum } from '../../common/enums/payment-status.enum';
import { PropertyApplicationEntity } from '../property-applications/entities/property-application.entity';
import { FineAssessmentEntity } from '../fines/entities/fine-assessment.entity';
import { AuditEventEntity } from '../audit/entities/audit-event.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(BillEntity)
    private readonly bills: Repository<BillEntity>,
    @InjectRepository(PaymentEntity)
    private readonly payments: Repository<PaymentEntity>,
    @InjectRepository(PropertyApplicationEntity)
    private readonly applications: Repository<PropertyApplicationEntity>,
    @InjectRepository(FineAssessmentEntity)
    private readonly fines: Repository<FineAssessmentEntity>,
    @InjectRepository(AuditEventEntity)
    private readonly audits: Repository<AuditEventEntity>,
  ) {}

  async revenueByCategory(fiscalYear?: string) {
    const qb = this.bills
      .createQueryBuilder('b')
      .leftJoin('b.taxCategory', 'c')
      .select('c.name', 'categoryName')
      .addSelect('c.code', 'categoryCode')
      .addSelect('COALESCE(SUM(b.principal), 0)', 'billed')
      .addSelect('COALESCE(SUM(b.amountPaid), 0)', 'collected')
      .addSelect(
        'COALESCE(SUM(b.totalPayable - b.amountPaid), 0)',
        'outstanding',
      )
      .addSelect('COALESCE(SUM(b.penalty), 0)', 'penalties')
      .addSelect('COUNT(b.id)', 'billCount')
      .groupBy('c.name')
      .addGroupBy('c.code')
      .orderBy('c.name', 'ASC');
    if (fiscalYear) qb.andWhere('b.fiscalYear = :fy', { fy: fiscalYear });
    return qb.getRawMany();
  }

  async revenueByPeriod(fiscalYear?: string) {
    const qb = this.bills
      .createQueryBuilder('b')
      .select('b.fiscalYear', 'fiscalYear')
      .addSelect('b.periodLabel', 'period')
      .addSelect('COALESCE(SUM(b.principal), 0)', 'billed')
      .addSelect('COALESCE(SUM(b.amountPaid), 0)', 'collected')
      .addSelect('COUNT(b.id)', 'billCount')
      .groupBy('b.fiscalYear')
      .addGroupBy('b.periodLabel')
      .orderBy('b.fiscalYear', 'DESC')
      .addOrderBy('b.periodLabel', 'DESC');
    if (fiscalYear) qb.andWhere('b.fiscalYear = :fy', { fy: fiscalYear });
    return qb.getRawMany();
  }

  async outstanding(limit = 100) {
    const bills = await this.bills
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.taxCategory', 'c')
      .leftJoinAndSelect('b.user', 'u')
      .where('b.status IN (:...s)', {
        s: [
          BillStatusEnum.ISSUED,
          BillStatusEnum.PARTIALLY_PAID,
          BillStatusEnum.OVERDUE,
        ],
      })
      .orderBy('b.dueDate', 'ASC')
      .limit(Math.min(limit, 500))
      .getMany();
    return bills.map((bill) => this.sanitizeBill(bill));
  }

  async overdue() {
    const bills = (
      await this.bills
        .createQueryBuilder('b')
        .leftJoinAndSelect('b.taxCategory', 'c')
        .where('b.dueDate < CURRENT_DATE')
        .andWhere('b.status IN (:...s)', {
          s: [
            BillStatusEnum.ISSUED,
            BillStatusEnum.PARTIALLY_PAID,
            BillStatusEnum.OVERDUE,
          ],
        })
        .orderBy('b.dueDate', 'ASC')
        .getMany()
    ).map((bill) => this.sanitizeBill(bill));
    const fineTotals = await this.fines
      .createQueryBuilder('f')
      .select('COALESCE(SUM(f.amount), 0)', 'total')
      .addSelect('COUNT(f.id)', 'count')
      .where('f.waived = false')
      .getRawOne<{ total: string; count: string }>();
    return {
      bills,
      fineTotal: parseFloat(fineTotals?.total ?? '0'),
      fineCount: Number(fineTotals?.count ?? 0),
    };
  }

  async collections(from?: string, to?: string) {
    const qb = this.payments
      .createQueryBuilder('p')
      .leftJoin('p.bill', 'b')
      .leftJoin('b.taxCategory', 'c')
      .select('p.method', 'method')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'total')
      .addSelect('COUNT(p.id)', 'count')
      .where('p.status = :s', { s: PaymentStatusEnum.VERIFIED })
      .groupBy('p.method');
    if (from) qb.andWhere('p.paidAt >= :from', { from });
    if (to) qb.andWhere('p.paidAt <= :to', { to });
    const byMethod = await qb.getRawMany();
    const grand = await this.payments
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.status = :s', { s: PaymentStatusEnum.VERIFIED })
      .andWhere(from ? 'p.paidAt >= :from' : '1=1', { from })
      .andWhere(to ? 'p.paidAt <= :to' : '1=1', { to })
      .getRawOne<{ total: string }>();
    return { byMethod, total: parseFloat(grand?.total ?? '0'), from, to };
  }

  async verificationQueue() {
    const [pending, correction, approved, rejected] = await Promise.all([
      this.applications.count({ where: { status: 'pending' as never } }),
      this.applications.count({
        where: { status: 'correction_requested' as never },
      }),
      this.applications.count({ where: { status: 'approved' as never } }),
      this.applications.count({ where: { status: 'rejected' as never } }),
    ]);
    const oldest = await this.applications.find({
      where: { status: 'pending' as never },
      order: { createdAt: 'ASC' },
      take: 20,
    });
    return {
      pending,
      correctionRequested: correction,
      approved,
      rejected,
      oldestPending: oldest,
    };
  }

  async employeeActions(limit = 50) {
    const [data, total] = await this.audits.findAndCount({
      relations: { actor: true },
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 200),
    });
    return {
      data: data.map((row) => ({
        ...row,
        actor: row.actor
          ? {
              id: row.actor.id,
              firstName: row.actor.firstName,
              lastName: row.actor.lastName,
              email: row.actor.email,
            }
          : null,
      })),
      total,
    };
  }

  private sanitizeBill(bill: BillEntity): BillEntity {
    if (bill.user) {
      const user = bill.user as unknown as Record<string, unknown>;
      delete user.passwordHash;
    }
    return bill;
  }
}
