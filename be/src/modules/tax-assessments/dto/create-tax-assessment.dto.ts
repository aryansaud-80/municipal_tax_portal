import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateTaxAssessmentDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  @IsOptional()
  propertyId?: string;

  @IsUUID()
  @IsNotEmpty()
  taxCategoryId!: string;

  @IsString()
  fiscalYear!: string;

  @IsNumber()
  @Min(0)
  assessedValue!: number;

  @IsNumber()
  @Min(0)
  taxAmount!: number;

  @IsNumber()
  @Min(0)
  discount?: number = 0;

  @IsNumber()
  @Min(0)
  penalty?: number = 0;

  @IsNumber()
  @Min(0)
  totalDue!: number;

  @IsDateString()
  dueDate!: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsObject()
  @IsOptional()
  inputs?: Record<string, number | string>;
}
