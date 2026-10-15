import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { BillingPeriodEnum } from '../../../common/enums/billing-period.enum';
import { PenaltyBaseEnum } from '../../../common/enums/penalty-base.enum';
import { RateTypeEnum } from '../../../common/enums/rate-type.enum';

export class CreateTaxRuleDto {
  @IsUUID()
  taxCategoryId!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsString()
  @MaxLength(20)
  fiscalYear!: string;

  @IsEnum(BillingPeriodEnum)
  billingPeriod!: BillingPeriodEnum;

  @IsDateString()
  effectiveFrom!: string;

  @IsDateString()
  @IsOptional()
  effectiveTo?: string;

  @IsEnum(RateTypeEnum)
  rateType!: RateTypeEnum;

  @IsNumber()
  @Min(0)
  rate!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  fixedAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  penaltyPercent?: number;

  @IsEnum(PenaltyBaseEnum)
  @IsOptional()
  penaltyBase?: PenaltyBaseEnum;

  @IsInt()
  @Min(0)
  @IsOptional()
  graceDays?: number;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsOptional()
  calculationConfig?: Record<string, unknown>;

  @IsOptional()
  requiredDocuments?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
