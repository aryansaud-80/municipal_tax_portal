import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities';
import { BillingPeriodEnum } from '../../../common/enums/billing-period.enum';
import { BillStatusEnum } from '../../../common/enums/bill-status.enum';
import type { UsersEntity } from '../../users/entities/users.entity';
import type { PropertyEntity } from '../../properties/entities/property.entity';
import type { TaxCategoryEntity } from '../../tax-categories/entities/tax-category.entity';
import type { TaxRuleEntity } from '../../tax-rules/entities/tax-rule.entity';
import type { TaxAssessmentEntity } from '../../tax-assessments/entities/tax-assessment.entity';

export interface BillCalculationBreakdown {
  baseAmount: number;
  rateApplied: number;
  rateType: string;
  slabDetails?: Array<{ label: string; amount: number }>;
  adjustments?: Array<{ label: string; amount: number; reason?: string }>;
  discount: number;
  penalty: number;
  totalPayable: number;
  ruleId?: string;
  ruleName?: string;
  inputs?: Record<string, unknown>;
}

@Entity({ name: 'bills' })
export class BillEntity extends BaseEntity {
  @Column({ name: 'bill_number', type: 'varchar', length: 50, unique: true })
  billNumber!: string;

  @Column({ name: 'assessment_id', type: 'uuid', nullable: true })
  assessmentId?: string;

  @ManyToOne('TaxAssessmentEntity', {
    eager: false,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'assessment_id' })
  assessment?: TaxAssessmentEntity;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne('UsersEntity', { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UsersEntity;

  @Column({ name: 'property_id', type: 'uuid', nullable: true })
  propertyId?: string;

  @ManyToOne('PropertyEntity', {
    eager: false,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'property_id' })
  property?: PropertyEntity;

  @Column({ name: 'tax_category_id', type: 'uuid' })
  taxCategoryId!: string;

  @ManyToOne('TaxCategoryEntity', { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tax_category_id' })
  taxCategory?: TaxCategoryEntity;

  @Column({ name: 'rule_id', type: 'uuid', nullable: true })
  ruleId?: string;

  @ManyToOne('TaxRuleEntity', {
    eager: false,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'rule_id' })
  rule?: TaxRuleEntity;

  @Column({ name: 'fiscal_year', type: 'varchar', length: 20 })
  fiscalYear!: string;

  @Column({
    name: 'billing_period',
    type: 'enum',
    enum: BillingPeriodEnum,
    default: BillingPeriodEnum.ANNUAL,
  })
  billingPeriod!: BillingPeriodEnum;

  @Column({ name: 'period_label', type: 'varchar', length: 50 })
  periodLabel!: string;

  @Column({ name: 'issue_date', type: 'date' })
  issueDate!: string;

  @Column({ name: 'due_date', type: 'date' })
  dueDate!: string;

  @Column({ name: 'principal', type: 'decimal', precision: 14, scale: 2 })
  principal!: number;

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

  @Column({ name: 'total_payable', type: 'decimal', precision: 14, scale: 2 })
  totalPayable!: number;

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
    enum: BillStatusEnum,
    default: BillStatusEnum.ISSUED,
  })
  status!: BillStatusEnum;

  @Column({ name: 'calculation_breakdown', type: 'jsonb', default: {} })
  calculationBreakdown!: BillCalculationBreakdown;

  @Column({ name: 'version', type: 'int', default: 1 })
  version!: number;

  @Column({ name: 'supersedes_bill_id', type: 'uuid', nullable: true })
  supersedesBillId?: string;

  @Column({ name: 'issued_by', type: 'uuid', nullable: true })
  issuedBy?: string;

  @Column({ name: 'cancelled_reason', type: 'text', nullable: true })
  cancelledReason?: string;
}
