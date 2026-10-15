import { PartialType } from '@nestjs/mapped-types';
import { CreateTaxAssessmentDto } from './create-tax-assessment.dto';

export class UpdateTaxAssessmentDto extends PartialType(
  CreateTaxAssessmentDto,
) {}
