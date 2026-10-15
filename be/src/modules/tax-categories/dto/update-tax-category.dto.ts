import { PartialType } from '@nestjs/mapped-types';
import { CreateTaxCategoryDto } from './create-tax-category.dto';

export class UpdateTaxCategoryDto extends PartialType(CreateTaxCategoryDto) {}
