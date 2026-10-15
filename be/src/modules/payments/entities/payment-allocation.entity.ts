import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities';

@Entity({ name: 'payment_allocations' })
export class PaymentAllocationEntity extends BaseEntity {
  @Column({ name: 'payment_id', type: 'uuid' })
  paymentId!: string;

  @ManyToOne('PaymentEntity', { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment?: any;

  @Column({ name: 'bill_id', type: 'uuid' })
  billId!: string;

  @ManyToOne('BillEntity', { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'bill_id' })
  bill?: any;

  @Column({ name: 'amount', type: 'decimal', precision: 14, scale: 2 })
  amount!: number;

  @Column({ name: 'allocated_by', type: 'uuid', nullable: true })
  allocatedBy?: string;
}
