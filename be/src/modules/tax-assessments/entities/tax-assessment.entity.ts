import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities';
import { TaxAssessmentStatusEnum } from '../../../common/enums/tax-assessment-status.enum';

@Entity({ name: 'tax_assessments' })
export class TaxAssessmentEntity extends BaseEntity {
  @Column({
    name: 'assessment_number',
    type: 'varchar',
    length: 50,
    unique: true,
  })
  assessmentNumber!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne('UsersEntity', { eager: false })
  @JoinColumn({ name: 'user_id' })
  user?: any;

  @Column({ name: 'property_id', type: 'uuid', nullable: true })
  propertyId?: string;

  @ManyToOne(
    'PropertyEntity',
    (p: { taxAssessments: unknown }) => p.taxAssessments,
    {
      nullable: true,
      eager: false,
    },
  )
  @JoinColumn({ name: 'property_id' })
  property?: any;

  @Column({ name: 'tax_category_id', type: 'uuid' })
  taxCategoryId!: string;

  @ManyToOne(
    'TaxCategoryEntity',
    (tc: { taxAssessments: unknown }) => tc.taxAssessments,
    {
      eager: false,
    },
  )
  @JoinColumn({ name: 'tax_category_id' })
  taxCategory?: any;

  @Column({ name: 'fiscal_year', type: 'varchar', length: 20 })
  fiscalYear!: string;

  @Column({
    name: 'assessed_value',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  assessedValue!: number;

  @Column({
    name: 'tax_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  taxAmount!: number;

  @Column({
    name: 'discount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  discount!: number;

  @Column({
    name: 'penalty',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  penalty!: number;

  @Column({
    name: 'total_due',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  totalDue!: number;

  @Column({
    name: 'amount_paid',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  amountPaid!: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: TaxAssessmentStatusEnum,
    default: TaxAssessmentStatusEnum.PENDING,
  })
  status!: TaxAssessmentStatusEnum;

  @Column({ name: 'due_date', type: 'date' })
  dueDate!: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'rule_id', type: 'uuid', nullable: true })
  ruleId?: string;

  @Column({ name: 'calculation_breakdown', type: 'jsonb', nullable: true })
  calculationBreakdown?: Record<string, unknown>;

  @Column({ name: 'is_locked', type: 'boolean', default: false })
  isLocked!: boolean;

  @Column({
    name: 'billing_period',
    type: 'varchar',
    length: 20,
    default: 'annual',
  })
  billingPeriod!: string;

  @Column({ name: 'period_label', type: 'varchar', length: 50, nullable: true })
  periodLabel?: string;
}
