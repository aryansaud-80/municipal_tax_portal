import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities';

@Entity({ name: 'receipts' })
export class ReceiptEntity extends BaseEntity {
  @Column({ name: 'receipt_number', type: 'varchar', length: 50, unique: true })
  receiptNumber!: string;

  @Column({ name: 'payment_id', type: 'uuid' })
  paymentId!: string;

  @ManyToOne('PaymentEntity', { eager: false })
  @JoinColumn({ name: 'payment_id' })
  payment?: any;

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

  @Column({ name: 'issued_at', type: 'timestamptz', default: () => 'NOW()' })
  issuedAt!: Date;

  @Column({
    name: 'balance_after',
    type: 'decimal',
    precision: 14,
    scale: 2,
    nullable: true,
  })
  balanceAfter?: number;

  @Column({ name: 'issued_by', type: 'uuid', nullable: true })
  issuedBy?: string;
}
