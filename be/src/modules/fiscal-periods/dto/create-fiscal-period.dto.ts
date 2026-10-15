import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { BillingPeriodEnum } from '../../../common/enums/billing-period.enum';

export class CreateFiscalPeriodDto {
  @IsString()
  @MaxLength(20)
  label!: string;

  @IsString()
  @MaxLength(50)
  categoryCode!: string;

  @IsEnum(BillingPeriodEnum)
  periodType!: BillingPeriodEnum;

  @IsDateString()
  startsOn!: string;

  @IsDateString()
  endsOn!: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
