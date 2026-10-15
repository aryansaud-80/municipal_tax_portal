import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersEntity } from '../users/entities/users.entity';
import { PropertyEntity } from '../properties/entities/property.entity';
import { TaxAssessmentEntity } from '../tax-assessments/entities/tax-assessment.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { TaxCategoryEntity } from '../tax-categories/entities/tax-category.entity';
import { BillEntity } from '../bills/entities/bill.entity';
import { PropertyApplicationEntity } from '../property-applications/entities/property-application.entity';
import { FineAssessmentEntity } from '../fines/entities/fine-assessment.entity';
import { PaymentStatusEnum } from '../../common/enums/payment-status.enum';
import { PropertyStatusEnum } from '../../common/enums/property-status.enum';
import { TaxAssessmentStatusEnum } from '../../common/enums/tax-assessment-status.enum';
import { BillStatusEnum } from '../../common/enums/bill-status.enum';
import { PropertyApplicationStatusEnum } from '../../common/enums/property-application-status.enum';
import { UserStatusEnum } from '../users/enums/user-status.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly userRepo: Repository<UsersEntity>,
    @InjectRepository(PropertyEntity)
    private readonly propertyRepo: Repository<PropertyEntity>,
    @InjectRepository(TaxAssessmentEntity)
    private readonly assessmentRepo: Repository<TaxAssessmentEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepo: Repository<PaymentEntity>,
    @InjectRepository(TaxCategoryEntity)
    private readonly categoryRepo: Repository<TaxCategoryEntity>,
    @InjectRepository(BillEntity)
    private readonly billRepo: Repository<BillEntity>,
    @InjectRepository(PropertyApplicationEntity)
    private readonly applicationRepo: Repository<PropertyApplicationEntity>,
    @InjectRepository(FineAssessmentEntity)
    private readonly fineRepo: Repository<FineAssessmentEntity>,
  ) {}

  async getAdminDashboard() {
    const [
      totalTaxpayers,
      totalProperties,
      totalAssessments,
      pendingAssessments,
      paidAssessments,
      pendingPayments,
      verifiedPayments,
      totalRevenueResult,
      outstandingResult,
      recentPayments,
      taxCategoryStats,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      billsIssued,
      billsOutstandingResult,
      billsOverdue,
      finesRecorded,
    ] = await Promise.all([
      this.userRepo.count({ where: { status: UserStatusEnum.ACTIVE } }),
      this.propertyRepo.count({
        where: { status: PropertyStatusEnum.ACTIVE },
      }),
      this.assessmentRepo.count(),
      this.assessmentRepo.count({
        where: { status: TaxAssessmentStatusEnum.PENDING },
      }),
      this.assessmentRepo.count({
        where: { status: TaxAssessmentStatusEnum.PAID },
      }),
      this.paymentRepo.count({ where: { status: PaymentStatusEnum.PENDING } }),
      this.paymentRepo.count({ where: { status: PaymentStatusEnum.VERIFIED } }),
      this.paymentRepo
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.amount), 0)', 'total')
        .where('p.status = :status', { status: PaymentStatusEnum.VERIFIED })
        .getRawOne<{ total: string }>(),
      this.assessmentRepo
        .createQueryBuilder('a')
        .select('COALESCE(SUM(a.total_due - a.amount_paid), 0)', 'total')
        .where('a.status IN (:...statuses)', {
          statuses: [
            TaxAssessmentStatusEnum.PENDING,
            TaxAssessmentStatusEnum.PARTIALLY_PAID,
            TaxAssessmentStatusEnum.OVERDUE,
          ],
        })
        .getRawOne<{ total: string }>(),
      this.paymentRepo.find({
        relations: { user: true, taxAssessment: { taxCategory: true } },
        order: { createdAt: 'DESC' },
        take: 10,
      }),
      this.getTaxCategoryStats(),
      this.applicationRepo.count({
        where: { status: PropertyApplicationStatusEnum.PENDING },
      }),
      this.applicationRepo.count({
        where: { status: PropertyApplicationStatusEnum.APPROVED },
      }),
      this.applicationRepo.count({
        where: { status: PropertyApplicationStatusEnum.REJECTED },
      }),
      this.billRepo.count(),
      this.billRepo
        .createQueryBuilder('b')
        .select('COALESCE(SUM(b.totalPayable - b.amountPaid), 0)', 'total')
        .where('b.status IN (:...statuses)', {
          statuses: [
            BillStatusEnum.ISSUED,
            BillStatusEnum.PARTIALLY_PAID,
            BillStatusEnum.OVERDUE,
          ],
        })
        .getRawOne<{ total: string }>(),
      this.billRepo.count({ where: { status: BillStatusEnum.OVERDUE } }),
      this.fineRepo
        .createQueryBuilder('f')
        .select('COALESCE(SUM(f.amount), 0)', 'total')
        .where('f.waived = false')
        .getRawOne<{ total: string }>(),
    ]);

    return {
      totalTaxpayers,
      totalProperties,
      totalAssessments,
      pendingAssessments,
      paidAssessments,
      pendingPayments,
      verifiedPayments,
      totalRevenue: parseFloat(totalRevenueResult?.total ?? '0'),
      outstandingTax: parseFloat(outstandingResult?.total ?? '0'),
      recentPayments: this.sanitizePayments(recentPayments),
      taxCategoryStats,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      billsIssued,
      billsOutstanding: parseFloat(billsOutstandingResult?.total ?? '0'),
      billsOverdue,
      finesRecorded: parseFloat(finesRecorded?.total ?? '0'),
    };
  }

  async getCitizenDashboard(userId: string) {
    const [
      propertyCount,
      totalOutstanding,
      totalPaid,
      pendingAssessments,
      recentPayments,
      recentAssessments,
    ] = await Promise.all([
      this.propertyRepo.count({ where: { userId } }),
      this.assessmentRepo
        .createQueryBuilder('a')
        .select('COALESCE(SUM(a.total_due - a.amount_paid), 0)', 'total')
        .where('a.user_id = :userId', { userId })
        .andWhere('a.status IN (:...statuses)', {
          statuses: [
            TaxAssessmentStatusEnum.PENDING,
            TaxAssessmentStatusEnum.PARTIALLY_PAID,
            TaxAssessmentStatusEnum.OVERDUE,
          ],
        })
        .getRawOne<{ total: string }>(),
      this.assessmentRepo
        .createQueryBuilder('a')
        .select('COALESCE(SUM(a.amount_paid), 0)', 'total')
        .where('a.user_id = :userId', { userId })
        .getRawOne<{ total: string }>(),
      this.assessmentRepo.count({
        where: {
          userId,
          status: TaxAssessmentStatusEnum.PENDING,
        },
      }),
      this.paymentRepo.find({
        where: { userId },
        relations: { taxAssessment: { taxCategory: true } },
        order: { createdAt: 'DESC' },
        take: 5,
      }),
      this.assessmentRepo.find({
        where: { userId },
        relations: { taxCategory: true, property: true },
        order: { createdAt: 'DESC' },
        take: 5,
      }),
    ]);

    return {
      propertyCount,
      totalOutstanding: parseFloat(totalOutstanding?.total ?? '0'),
      totalPaid: parseFloat(totalPaid?.total ?? '0'),
      pendingAssessments,
      recentPayments,
      recentAssessments,
    };
  }

  private sanitizePayments(payments: PaymentEntity[]): PaymentEntity[] {
    return payments.map((payment) => {
      const user = payment.user as unknown as
        Record<string, unknown> | undefined;
      if (user) delete user.passwordHash;
      return payment;
    });
  }

  private async getTaxCategoryStats() {
    const categories = await this.categoryRepo.find({
      where: { isActive: true },
    });
    const stats: Array<{
      categoryId: string;
      categoryName: string;
      categoryCode: unknown;
      totalAssessed: number;
      totalCollected: number;
    }> = [];
    for (const category of categories) {
      const total = await this.assessmentRepo
        .createQueryBuilder('a')
        .select('COALESCE(SUM(a.tax_amount), 0)', 'total')
        .where('a.tax_category_id = :catId', { catId: category.id })
        .getRawOne<{ total: string }>();
      const collected = await this.assessmentRepo
        .createQueryBuilder('a')
        .select('COALESCE(SUM(a.amount_paid), 0)', 'collected')
        .where('a.tax_category_id = :catId', { catId: category.id })
        .getRawOne<{ collected: string }>();
      stats.push({
        categoryId: category.id,
        categoryName: category.name,
        categoryCode: category.code,
        totalAssessed: parseFloat(total?.total ?? '0'),
        totalCollected: parseFloat(collected?.collected ?? '0'),
      });
    }
    return stats;
  }
}
