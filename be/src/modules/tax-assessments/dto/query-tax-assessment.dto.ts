import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { SortOrder } from '../../../common/enums/sort-order.enum';
import { TaxAssessmentStatusEnum } from '../../../common/enums/tax-assessment-status.enum';

export enum TaxAssessmentSortableField {
  ASSESSMENT_NUMBER = 'assessmentNumber',
  TOTAL_DUE = 'totalDue',
  DUE_DATE = 'dueDate',
  CREATED_AT = 'createdAt',
}

export class QueryTaxAssessmentDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  taxCategoryId?: string;

  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @IsEnum(TaxAssessmentStatusEnum)
  @IsOptional()
  status?: TaxAssessmentStatusEnum;

  @IsOptional()
  @IsString()
  fiscalYear?: string;

  @IsOptional()
  @IsEnum(TaxAssessmentSortableField)
  sortBy?: TaxAssessmentSortableField = TaxAssessmentSortableField.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
