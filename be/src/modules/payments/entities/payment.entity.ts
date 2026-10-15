import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities';
import { PaymentMethodEnum } from '../../../common/enums/payment-method.enum';
import { PaymentStatusEnum } from '../../../common/enums/payment-status.enum';

@Entity({ name: 'payments' })
export class PaymentEntity extends BaseEntity {
  @Column({ name: 'payment_number', type: 'varchar', length: 50, unique: true })
  paymentNumber!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne('UsersEntity', { eager: false })
  @JoinColumn({ name: 'user_id' })
  user?: any;

  @Column({ name: 'tax_assessment_id', type: 'uuid' })
  taxAssessmentId!: string;

  @ManyToOne('TaxAssessmentEntity', { eager: false })
  @JoinColumn({ name: 'tax_assessment_id' })
  taxAssessment?: any;

  @Column({ name: 'amount', type: 'decimal', precision: 14, scale: 2 })
  amount!: number;

  @Column({
    name: 'method',
    type: 'enum',
    enum: PaymentMethodEnum,
  })
  method!: PaymentMethodEnum;

  @Column({
    name: 'gateway_transaction_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  gatewayTransactionId?: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: PaymentStatusEnum,
    default: PaymentStatusEnum.PENDING,
  })
  status!: PaymentStatusEnum;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt?: Date;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt?: Date;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy?: string;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason?: string;

  @Column({ name: 'bill_id', type: 'uuid', nullable: true })
  billId?: string;

  @ManyToOne('BillEntity', { eager: false, nullable: true })
  @JoinColumn({ name: 'bill_id' })
  bill?: any;

  @Column({ name: 'provider', type: 'varchar', length: 50, default: 'office' })
  provider!: string;

  @Column({
    name: 'provider_ref',
    type: 'varchar',
    length: 255,
    nullable: true,
    unique: true,
  })
  providerRef?: string;

  @Column({
    name: 'idempotency_key',
    type: 'varchar',
    length: 255,
    nullable: true,
    unique: true,
  })
  idempotencyKey?: string;

  @Column({ name: 'raw_callback', type: 'jsonb', nullable: true })
  rawCallback?: Record<string, unknown>;

  @Column({
    name: 'receipt_number',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  receiptNumber?: string;
}
