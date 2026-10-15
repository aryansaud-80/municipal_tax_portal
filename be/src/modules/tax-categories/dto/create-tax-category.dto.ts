import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TaxCategoryCodeEnum } from '../../../common/enums/tax-category-code.enum';
import { RateTypeEnum } from '../../../common/enums/rate-type.enum';

export class CreateTaxCategoryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(TaxCategoryCodeEnum)
  code!: TaxCategoryCodeEnum;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(RateTypeEnum)
  rateType!: RateTypeEnum;

  @IsNumber()
  @Min(0)
  rate!: number;

  @IsNumber()
  @Min(0)
  minAmount?: number = 0;
}
