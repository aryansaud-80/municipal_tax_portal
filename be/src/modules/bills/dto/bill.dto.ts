import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { BillingPeriodEnum } from '../../../common/enums/billing-period.enum';

export class CreateBillDto {
  @IsUUID()
  taxCategoryId!: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsUUID()
  @IsOptional()
  propertyId?: string;

  @IsString()
  fiscalYear!: string;

  @IsEnum(BillingPeriodEnum)
  @IsOptional()
  billingPeriod?: BillingPeriodEnum;

  @IsString()
  @IsOptional()
  periodLabel?: string;

  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsObject()
  inputs!: Record<string, number | string>;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;
}

export class BulkIssueDto {
  @IsUUID()
  taxCategoryId!: string;

  @IsString()
  fiscalYear!: string;

  @IsString()
  @IsOptional()
  periodLabel?: string;

  @IsUUID(undefined, { each: true })
  @IsOptional()
  propertyIds?: string[];

  @IsNumber()
  @IsOptional()
  ward?: number;

  @IsOptional()
  inputs?: Record<string, Record<string, number | string>>;
}

export class AmendBillDto {
  @IsOptional()
  adjustments?: Array<{ label: string; amount: number; reason?: string }>;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsString()
  reason!: string;
}

export class CancelBillDto {
  @IsString()
  reason!: string;
}
