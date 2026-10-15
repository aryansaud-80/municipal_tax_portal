import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities';
import { BillingPeriodEnum } from '../../../common/enums/billing-period.enum';

@Entity({ name: 'fiscal_periods' })
export class FiscalPeriodEntity extends BaseEntity {
  @Column({ name: 'label', type: 'varchar', length: 20 })
  label!: string;

  @Column({ name: 'category_code', type: 'varchar', length: 50 })
  categoryCode!: string;

  @Column({
    name: 'period_type',
    type: 'enum',
    enum: BillingPeriodEnum,
  })
  periodType!: BillingPeriodEnum;

  @Column({ name: 'starts_on', type: 'date' })
  startsOn!: string;

  @Column({ name: 'ends_on', type: 'date' })
  endsOn!: string;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
