import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { PaymentEntity } from '../entities/payment.entity';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import {
  QueryPaymentDto,
  PaymentSortableField,
} from '../dto/query-payment.dto';
import { findEntityOrFail } from '../../../common/utils/find-or-fail.util';
import { PaymentStatusEnum } from '../../../common/enums/payment-status.enum';
import { PaymentMethodEnum } from '../../../common/enums/payment-method.enum';
import { TaxAssessmentStatusEnum } from '../../../common/enums/tax-assessment-status.enum';
import { BillStatusEnum } from '../../../common/enums/bill-status.enum';
import { SortOrder } from '../../../common/enums/sort-order.enum';
import { TaxAssessmentEntity } from '../../tax-assessments/entities/tax-assessment.entity';
import { BillEntity } from '../../bills/entities/bill.entity';
import { ReceiptEntity } from '../../receipts/entities/receipt.entity';
import { PaymentAllocationEntity } from '../entities/payment-allocation.entity';
import { AuditService } from '../../audit/audit.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationTypeEnum } from '../../../common/enums/notification-type.enum';
import { fromPaisa, toPaisa } from '../../../common/utils/money.util';
import { newProviderRef, verifyCallbackSignature } from '../mock-provider.util';

const ALIAS = 'payment';

export class OfficePaymentDto {
  billId!: string;
  amount!: number;
  method!: PaymentMethodEnum;
  referenceNumber?: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly repo: Repository<PaymentEntity>,
    @InjectRepository(TaxAssessmentEntity)
    private readonly assessmentRepo: Repository<TaxAssessmentEntity>,
    @InjectRepository(BillEntity)
    private readonly billRepo: Repository<BillEntity>,
    @InjectRepository(ReceiptEntity)
    private readonly receiptRepo: Repository<ReceiptEntity>,
    @InjectRepository(PaymentAllocationEntity)
    private readonly allocationRepo: Repository<PaymentAllocationEntity>,
    private readonly dataSource: DataSource,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Legacy assessment-based initiation (kept for compatibility). */
  async create(dto: CreatePaymentDto, userId: string): Promise<PaymentEntity> {
    const assessment = await findEntityOrFail(
      this.assessmentRepo,
      { id: dto.taxAssessmentId },
      'Tax Assessment',
      dto.taxAssessmentId,
    );
    if (assessment.userId !== userId) {
      throw new ForbiddenException(
        'You cannot pay another citizen\u2019s assessment',
      );
    }
    if (assessment.status === TaxAssessmentStatusEnum.PAID) {
      throw new BadRequestException(
        'This tax assessment is already fully paid',
      );
    }
    if (dto.amount > assessment.totalDue - assessment.amountPaid) {
      throw new BadRequestException(
        `Payment amount exceeds outstanding balance of ${assessment.totalDue - assessment.amountPaid}`,
      );
    }
    const paymentNumber = await this.generatePaymentNumber();
    return this.repo.save(
      this.repo.create({
        paymentNumber,
        userId,
        taxAssessmentId: dto.taxAssessmentId,
        amount: dto.amount,
        method: dto.method,
        provider: 'office',
        status: PaymentStatusEnum.PENDING,
      }),
    );
  }

  /** Server-side online initiation against a bill. Amount is derived server-side. */
  async initiateOnline(
    billId: string,
    userId: string,
    amount?: number,
    idempotencyKey?: string,
  ): Promise<{
    payment: PaymentEntity;
    checkout: { providerRef: string; amount: number; currency: string };
  }> {
    if (idempotencyKey) {
      const prior = await this.repo.findOne({ where: { idempotencyKey } });
      if (prior) {
        return {
          payment: prior,
          checkout: {
            providerRef: prior.providerRef!,
            amount: Number(prior.amount),
            currency: 'NPR',
          },
        };
      }
    }
    const bill = await this.billRepo.findOne({ where: { id: billId } });
    if (!bill) throw new NotFoundException(`Bill '${billId}' not found`);
    if (bill.userId !== userId) {
      throw new ForbiddenException(
        'You cannot pay another citizen\u2019s bill',
      );
    }
    const balance = this.billBalance(bill);
    if (toPaisa(balance) <= 0)
      throw new BadRequestException('This bill is already fully paid');
    const payAmount = amount ?? balance;
    if (!(payAmount > 0))
      throw new BadRequestException('Payment amount must be positive');
    if (toPaisa(payAmount) > toPaisa(balance)) {
      throw new BadRequestException(
        `Amount exceeds outstanding balance of NPR ${balance}`,
      );
    }
    const payment = await this.repo.save(
      this.repo.create({
        paymentNumber: await this.generatePaymentNumber(),
        userId,
        taxAssessmentId:
          bill.assessmentId ?? (await this.ensureLegacyAssessment(bill)).id,
        billId: bill.id,
        amount: payAmount,
        method: PaymentMethodEnum.ESEWA,
        provider: 'mock_esewa',
        providerRef: newProviderRef(),
        idempotencyKey: idempotencyKey ?? newProviderRef(),
        status: PaymentStatusEnum.PENDING,
      }),
    );
    return {
      payment,
      checkout: {
        providerRef: payment.providerRef!,
        amount: Number(payment.amount),
        currency: 'NPR',
      },
    };
  }

  /**
   * Provider callback. NEVER trusts browser redirects — requires the
   * HMAC signature and validates amount server-side. Idempotent: duplicate
   * deliveries return the existing payment without double-crediting.
   */
  async handleProviderCallback(body: {
    providerRef: string;
    status: 'success' | 'failed' | 'cancelled';
    amount: number;
    signature: string;
    raw?: Record<string, unknown>;
  }): Promise<PaymentEntity> {
    if (
      !verifyCallbackSignature(body.providerRef, body.status, body.signature)
    ) {
      throw new ForbiddenException('Invalid provider callback signature');
    }
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      const payment = await runner.manager.findOne(PaymentEntity, {
        where: { providerRef: body.providerRef },
        lock: { mode: 'pessimistic_write' },
      });
      if (!payment) throw new NotFoundException('Unknown provider reference');
      payment.rawCallback = {
        ...(body.raw ?? {}),
        status: body.status,
        receivedAt: new Date().toISOString(),
      };
      if (
        payment.status === PaymentStatusEnum.VERIFIED ||
        payment.status === PaymentStatusEnum.SUCCESS
      ) {
        // Duplicate callback — acknowledge without double-crediting.
        await runner.manager.save(payment);
        await runner.commitTransaction();
        return payment;
      }
      if (toPaisa(body.amount) !== toPaisa(payment.amount)) {
        payment.status = PaymentStatusEnum.FAILED;
        payment.failureReason = `Amount mismatch: expected ${payment.amount}, got ${body.amount}`;
        await runner.manager.save(payment);
        await runner.commitTransaction();
        throw new BadRequestException(
          'Callback amount does not match the initiated payment',
        );
      }
      if (body.status !== 'success') {
        payment.status =
          body.status === 'cancelled'
            ? PaymentStatusEnum.CANCELLED
            : PaymentStatusEnum.FAILED;
        payment.failureReason = `Provider reported ${body.status}`;
        await runner.manager.save(payment);
        await runner.commitTransaction();
        return payment;
      }
      payment.status = PaymentStatusEnum.VERIFIED;
      payment.verifiedAt = new Date();
      payment.paidAt = payment.paidAt ?? new Date();
      await runner.manager.save(payment);
      await this.applyToBill(runner, payment, undefined);
      await runner.commitTransaction();
      await this.audit.record('payment.online-success', 'payment', payment.id, {
        providerRef: payment.providerRef,
      });
      return payment;
    } catch (error) {
      try {
        await runner.rollbackTransaction();
      } catch {
        /* already handled */
      }
      throw error;
    } finally {
      await runner.release();
    }
  }

  /**
   * Development-only mock provider confirmation. Simulates what the real
   * provider's server would do (verify + settle), entirely server-side.
   * Disabled in production. The browser never marks payments successful.
   */
  async confirmMockPayment(
    providerRef: string,
    userId: string,
  ): Promise<PaymentEntity> {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'Mock payment provider is disabled in production',
      );
    }
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      const payment = await runner.manager.findOne(PaymentEntity, {
        where: { providerRef },
        lock: { mode: 'pessimistic_write' },
      });
      if (!payment) throw new NotFoundException('Unknown provider reference');
      if (payment.userId !== userId) {
        throw new ForbiddenException(
          'You cannot confirm another citizen\u2019s payment',
        );
      }
      if (payment.provider !== 'mock_esewa') {
        throw new BadRequestException(
          'Only mock-provider payments can be mock-confirmed',
        );
      }
      if (
        payment.status === PaymentStatusEnum.VERIFIED ||
        payment.status === PaymentStatusEnum.SUCCESS
      ) {
        await runner.commitTransaction();
        return payment;
      }
      if (payment.status !== PaymentStatusEnum.PENDING) {
        throw new BadRequestException(
          `Cannot confirm a ${payment.status} payment`,
        );
      }
      payment.status = PaymentStatusEnum.VERIFIED;
      payment.verifiedAt = new Date();
      payment.paidAt = payment.paidAt ?? new Date();
      payment.rawCallback = {
        mock: true,
        note: 'Development mock-provider settlement (not a real payment)',
        confirmedAt: new Date().toISOString(),
      };
      await runner.manager.save(payment);
      await this.applyToBill(runner, payment, undefined);
      await runner.commitTransaction();
      await this.audit.record('payment.mock-confirm', 'payment', payment.id, {
        providerRef,
        mock: true,
      });
      return payment;
    } catch (error) {
      try {
        await runner.rollbackTransaction();
      } catch {
        /* already handled */
      }
      throw error;
    } finally {
      await runner.release();
    }
  }

  /** Counter payment recorded by authorized staff. Created already verified. */
  async recordOfficePayment(
    dto: OfficePaymentDto,
    receivedBy: string,
  ): Promise<PaymentEntity> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      const bill = await runner.manager.findOne(BillEntity, {
        where: { id: dto.billId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!bill) throw new NotFoundException(`Bill '${dto.billId}' not found`);
      const balance = this.billBalance(bill);
      if (!(dto.amount > 0))
        throw new BadRequestException('Amount must be positive');
      if (toPaisa(dto.amount) > toPaisa(balance)) {
        throw new BadRequestException(
          `Amount exceeds outstanding balance of NPR ${balance}`,
        );
      }
      const payment = await runner.manager.save(
        runner.manager.create(PaymentEntity, {
          paymentNumber: `PAY-${String((await runner.manager.count(PaymentEntity)) + 1).padStart(6, '0')}`,
          userId: bill.userId,
          taxAssessmentId:
            bill.assessmentId ?? (await this.ensureLegacyAssessment(bill)).id,
          billId: bill.id,
          amount: dto.amount,
          method: dto.method,
          provider: 'office',
          gatewayTransactionId: dto.referenceNumber,
          status: PaymentStatusEnum.VERIFIED,
          paidAt: new Date(),
          verifiedAt: new Date(),
          verifiedBy: receivedBy,
        }),
      );
      await this.applyToBill(runner, payment, receivedBy);
      await runner.commitTransaction();
      await this.audit.record(
        'payment.office-record',
        'payment',
        payment.id,
        {
          billId: bill.id,
          amount: dto.amount,
          method: dto.method,
        },
        receivedBy,
      );
      return payment;
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }

  async findAll(query: QueryPaymentDto) {
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
  ): Promise<PaymentEntity> {
    const payment = await findEntityOrFail(this.repo, { id }, 'Payment', id);
    if (!staff && requesterId && payment.userId !== requesterId) {
      throw new ForbiddenException(
        'You cannot view another citizen\u2019s payment',
      );
    }
    return payment;
  }

  async findByUser(userId: string): Promise<PaymentEntity[]> {
    return this.repo.find({
      where: { userId },
      relations: {
        taxAssessment: { taxCategory: true },
        bill: { taxCategory: true },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async verifyPayment(id: string, verifiedBy: string): Promise<PaymentEntity> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      const payment = await runner.manager.findOne(PaymentEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!payment) throw new NotFoundException(`Payment '${id}' not found`);
      if (payment.status === PaymentStatusEnum.VERIFIED) {
        throw new BadRequestException('Payment is already verified');
      }
      if (
        payment.status === PaymentStatusEnum.FAILED ||
        payment.status === PaymentStatusEnum.CANCELLED
      ) {
        throw new BadRequestException(
          `Cannot verify a ${payment.status} payment`,
        );
      }
      if (payment.provider === 'mock_esewa' && payment.rawCallback == null) {
        throw new BadRequestException(
          'Online payments require a verified provider callback before manual verification',
        );
      }
      payment.status = PaymentStatusEnum.VERIFIED;
      payment.verifiedAt = new Date();
      payment.verifiedBy = verifiedBy;
      payment.paidAt = payment.paidAt ?? new Date();
      await runner.manager.save(payment);
      await this.applyToBill(runner, payment, verifiedBy);
      await runner.commitTransaction();
      await this.audit.record('payment.verify', 'payment', id, {}, verifiedBy);
      return payment;
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }

  async updateStatus(
    id: string,
    status: PaymentStatusEnum,
  ): Promise<PaymentEntity> {
    const entity = await findEntityOrFail(this.repo, { id }, 'Payment', id);
    entity.status = status;
    return this.repo.save(entity);
  }

  async setGatewayTransactionId(
    id: string,
    gatewayTransactionId: string,
  ): Promise<void> {
    await this.repo.update(id, { gatewayTransactionId });
  }

  async getTotalRevenue(): Promise<number> {
    const result = await this.repo
      .createQueryBuilder(ALIAS)
      .select(`COALESCE(SUM(${ALIAS}.amount), 0)`, 'total')
      .where(`${ALIAS}.status = :status`, {
        status: PaymentStatusEnum.VERIFIED,
      })
      .getRawOne<{ total: string }>();
    return parseFloat(result?.total ?? '0');
  }

  async count(): Promise<number> {
    return this.repo.count();
  }

  async countPending(): Promise<number> {
    return this.repo.count({ where: { status: PaymentStatusEnum.PENDING } });
  }

  private billBalance(bill: BillEntity): number {
    // totalPayable already includes principal + penalty − discount.
    return fromPaisa(toPaisa(bill.totalPayable) - toPaisa(bill.amountPaid));
  }

  /** Credits the bill, records the allocation, updates legacy assessment, issues receipt. */
  private async applyToBill(
    runner: ReturnType<DataSource['createQueryRunner']>,
    payment: PaymentEntity,
    actorId?: string,
  ): Promise<void> {
    if (payment.billId) {
      const bill = await runner.manager.findOne(BillEntity, {
        where: { id: payment.billId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!bill) throw new NotFoundException('Linked bill not found');
      const balance = this.billBalance(bill);
      if (toPaisa(payment.amount) > toPaisa(balance)) {
        throw new BadRequestException(
          'Payment exceeds the bill\u2019s outstanding balance',
        );
      }
      bill.amountPaid = fromPaisa(
        toPaisa(bill.amountPaid) + toPaisa(payment.amount),
      );
      const remaining = this.billBalance(bill);
      bill.status =
        toPaisa(remaining) <= 0
          ? BillStatusEnum.PAID
          : toPaisa(bill.amountPaid) > 0
            ? BillStatusEnum.PARTIALLY_PAID
            : bill.status;
      await runner.manager.save(bill);
      const dup = await runner.manager.findOne(PaymentAllocationEntity, {
        where: { paymentId: payment.id, billId: bill.id },
      });
      if (!dup) {
        await runner.manager.save(
          runner.manager.create(PaymentAllocationEntity, {
            paymentId: payment.id,
            billId: bill.id,
            amount: payment.amount,
            allocatedBy: actorId,
          }),
        );
      }
      const receiptCount = await runner.manager.count(ReceiptEntity);
      const existingReceipt = await runner.manager.findOne(ReceiptEntity, {
        where: { paymentId: payment.id },
      });
      if (!existingReceipt) {
        await runner.manager.save(
          runner.manager.create(ReceiptEntity, {
            receiptNumber: `RCP-${String(receiptCount + 1).padStart(6, '0')}`,
            paymentId: payment.id,
            userId: payment.userId,
            taxAssessmentId: payment.taxAssessmentId,
            amount: payment.amount,
            balanceAfter: remaining,
            issuedBy: actorId,
          }),
        );
      }
      await this.notifications.create({
        userId: payment.userId,
        title: 'Payment verified',
        message: `NPR ${payment.amount} received for bill ${bill.billNumber}. Balance: NPR ${remaining}.`,
        type: NotificationTypeEnum.SUCCESS,
        link: '/receipts',
      });
    }
    const assessment = await runner.manager.findOne(TaxAssessmentEntity, {
      where: { id: payment.taxAssessmentId },
      lock: { mode: 'pessimistic_write' },
    });
    if (assessment) {
      assessment.amountPaid =
        Number(assessment.amountPaid) + Number(payment.amount);
      assessment.status =
        assessment.amountPaid >= assessment.totalDue
          ? TaxAssessmentStatusEnum.PAID
          : TaxAssessmentStatusEnum.PARTIALLY_PAID;
      await runner.manager.save(assessment);
      if (!payment.billId) {
        const existingReceipt = await runner.manager.findOne(ReceiptEntity, {
          where: { paymentId: payment.id },
        });
        if (!existingReceipt) {
          const receiptCount = await runner.manager.count(ReceiptEntity);
          await runner.manager.save(
            runner.manager.create(ReceiptEntity, {
              receiptNumber: `RCP-${String(receiptCount + 1).padStart(6, '0')}`,
              paymentId: payment.id,
              userId: payment.userId,
              taxAssessmentId: payment.taxAssessmentId,
              amount: payment.amount,
              issuedBy: actorId,
            }),
          );
        }
      }
    }
  }

  private async ensureLegacyAssessment(
    bill: BillEntity,
  ): Promise<TaxAssessmentEntity> {
    if (bill.assessmentId) {
      const found = await this.assessmentRepo.findOne({
        where: { id: bill.assessmentId },
      });
      if (found) return found;
    }
    // Compatibility shim for bills created without an assessment row.
    const count = await this.assessmentRepo.count();
    return this.assessmentRepo.save(
      this.assessmentRepo.create({
        assessmentNumber: `TAX-${String(count + 1).padStart(6, '0')}`,
        userId: bill.userId,
        propertyId: bill.propertyId,
        taxCategoryId: bill.taxCategoryId,
        fiscalYear: bill.fiscalYear,
        assessedValue: bill.principal,
        taxAmount: bill.principal,
        discount: bill.discount,
        penalty: bill.penalty,
        totalDue: bill.totalPayable,
        amountPaid: bill.amountPaid,
        status: TaxAssessmentStatusEnum.PENDING,
        dueDate: bill.dueDate,
        notes: `Auto-created for bill ${bill.billNumber}`,
      }),
    );
  }

  private async generatePaymentNumber(): Promise<string> {
    const count = await this.repo.count();
    return `PAY-${String(count + 1).padStart(6, '0')}`;
  }

  private buildQuery(
    query: QueryPaymentDto,
  ): SelectQueryBuilder<PaymentEntity> {
    const qb = this.repo.createQueryBuilder(ALIAS);
    qb.leftJoinAndSelect(`${ALIAS}.user`, 'user');
    qb.leftJoinAndSelect(`${ALIAS}.taxAssessment`, 'taxAssessment');
    qb.leftJoinAndSelect('taxAssessment.taxCategory', 'taxCategory');
    if (query.search) {
      qb.andWhere(`${ALIAS}.payment_number ILIKE :search`, {
        search: `%${query.search}%`,
      });
    }
    if (query.userId)
      qb.andWhere(`${ALIAS}.user_id = :userId`, { userId: query.userId });
    if (query.taxAssessmentId) {
      qb.andWhere(`${ALIAS}.tax_assessment_id = :taxAssessmentId`, {
        taxAssessmentId: query.taxAssessmentId,
      });
    }
    if (query.status)
      qb.andWhere(`${ALIAS}.status = :status`, { status: query.status });
    if (query.method)
      qb.andWhere(`${ALIAS}.method = :method`, { method: query.method });
    const sortBy = query.sortBy ?? PaymentSortableField.CREATED_AT;
    const sortOrder = query.sortOrder ?? SortOrder.DESC;
    qb.orderBy(`${ALIAS}.${sortBy}`, sortOrder);
    return qb;
  }
}
