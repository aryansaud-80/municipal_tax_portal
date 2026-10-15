import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities';
import { BillingPeriodEnum } from '../../../common/enums/billing-period.enum';
import { PenaltyBaseEnum } from '../../../common/enums/penalty-base.enum';
import { RateTypeEnum } from '../../../common/enums/rate-type.enum';

export interface TaxRuleCalculationConfig {
  slabs?: Array<{ upTo: number | null; rate: number }>;
  fixedAmount?: number;
  exemptUpTo?: number;
  deductions?: number;
  notes?: string;
  [key: string]: unknown;
}

@Entity({ name: 'tax_rules' })
export class TaxRuleEntity extends BaseEntity {
  @Column({ name: 'tax_category_id', type: 'uuid' })
  taxCategoryId!: string;

  @ManyToOne('TaxCategoryEntity', { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tax_category_id' })
  taxCategory?: any;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'fiscal_year', type: 'varchar', length: 20 })
  fiscalYear!: string;

  @Column({ name: 'billing_period', type: 'enum', enum: BillingPeriodEnum })
  billingPeriod!: BillingPeriodEnum;

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom!: string;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo?: string;

  @Column({ name: 'rate_type', type: 'enum', enum: RateTypeEnum })
  rateType!: RateTypeEnum;

  @Column({
    name: 'rate',
    type: 'decimal',
    precision: 10,
    scale: 4,
    default: 0,
  })
  rate!: number;

  @Column({
    name: 'min_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  minAmount!: number;

  @Column({
    name: 'fixed_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    nullable: true,
  })
  fixedAmount?: number;

  @Column({
    name: 'penalty_percent',
    type: 'decimal',
    precision: 7,
    scale: 4,
    default: 0,
  })
  penaltyPercent!: number;

  @Column({
    name: 'penalty_base',
    type: 'enum',
    enum: PenaltyBaseEnum,
    default: PenaltyBaseEnum.OUTSTANDING,
  })
  penaltyBase!: PenaltyBaseEnum;

  @Column({ name: 'grace_days', type: 'int', default: 0 })
  graceDays!: number;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: string;

  @Column({ name: 'calculation_config', type: 'jsonb', default: {} })
  calculationConfig!: TaxRuleCalculationConfig;

  @Column({ name: 'required_documents', type: 'jsonb', default: [] })
  requiredDocuments!: string[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string;
}
