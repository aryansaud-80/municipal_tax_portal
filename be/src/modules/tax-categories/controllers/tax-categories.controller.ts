import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { TaxCategoriesService } from '../services/tax-categories.service';
import { CreateTaxCategoryDto } from '../dto/create-tax-category.dto';
import { UpdateTaxCategoryDto } from '../dto/update-tax-category.dto';
import { Permissions } from '../../../common/decorators/permissions.decorator';

@Controller('tax-categories')
export class TaxCategoriesController {
  constructor(private readonly service: TaxCategoriesService) {}

  @Post()
  @Permissions('propertyTax.create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTaxCategoryDto) {
    return this.service.create(dto);
  }

  @Get()
  @Permissions('propertyTax.view')
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Permissions('propertyTax.view')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions('propertyTax.update')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaxCategoryDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/toggle-active')
  @Permissions('propertyTax.update')
  @HttpCode(HttpStatus.OK)
  async toggleActive(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.toggleActive(id);
  }

  @Delete(':id')
  @Permissions('propertyTax.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.remove(id);
  }
}
