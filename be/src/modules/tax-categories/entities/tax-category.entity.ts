import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities';
import { TaxCategoryCodeEnum } from '../../../common/enums/tax-category-code.enum';
import { RateTypeEnum } from '../../../common/enums/rate-type.enum';

@Entity({ name: 'tax_categories' })
export class TaxCategoryEntity extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 255 })
  name!: string;

  @Column({
    name: 'code',
    type: 'enum',
    enum: TaxCategoryCodeEnum,
    unique: true,
  })
  code!: TaxCategoryCodeEnum;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({
    name: 'rate_type',
    type: 'enum',
    enum: RateTypeEnum,
    default: RateTypeEnum.PERCENTAGE,
  })
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
    precision: 12,
    scale: 2,
    default: 0,
  })
  minAmount!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(
    'TaxAssessmentEntity',
    (assessment: { taxCategory: unknown }) => assessment.taxCategory,
  )
  taxAssessments?: any[];
}
