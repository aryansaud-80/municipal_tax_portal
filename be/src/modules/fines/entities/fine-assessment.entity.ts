import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities';
import { PenaltyBaseEnum } from '../../../common/enums/penalty-base.enum';

@Entity({ name: 'fine_assessments' })
export class FineAssessmentEntity extends BaseEntity {
  @Column({ name: 'fine_number', type: 'varchar', length: 50, unique: true })
  fineNumber!: string;

  @Column({ name: 'bill_id', type: 'uuid' })
  billId!: string;

  @ManyToOne('BillEntity', { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bill_id' })
  bill?: any;

  @Column({ name: 'rule_id', type: 'uuid', nullable: true })
  ruleId?: string;

  @Column({ name: 'base_amount', type: 'decimal', precision: 14, scale: 2 })
  baseAmount!: number;

  @Column({ name: 'penalty_base', type: 'enum', enum: PenaltyBaseEnum })
  penaltyBase!: PenaltyBaseEnum;

  @Column({ name: 'percent', type: 'decimal', precision: 7, scale: 4 })
  percent!: number;

  @Column({ name: 'amount', type: 'decimal', precision: 14, scale: 2 })
  amount!: number;

  @Column({ name: 'assessed_date', type: 'date' })
  assessedDate!: string;

  @Column({ name: 'period_label', type: 'varchar', length: 50 })
  periodLabel!: string;

  @Column({
    name: 'assessed_by',
    type: 'varchar',
    length: 20,
    default: 'system',
  })
  assessedBy!: string;

  @Column({ name: 'waived', type: 'boolean', default: false })
  waived!: boolean;

  @Column({ name: 'waiver_reason', type: 'text', nullable: true })
  waiverReason?: string;

  @Column({ name: 'waived_by', type: 'uuid', nullable: true })
  waivedBy?: string;

  @Column({ name: 'waived_at', type: 'timestamptz', nullable: true })
  waivedAt?: Date;
}
