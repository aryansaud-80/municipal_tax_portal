import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TaxRulesService } from './tax-rules.service';
import { CreateTaxRuleDto } from './dto/create-tax-rule.dto';
import { UpdateTaxRuleDto } from './dto/update-tax-rule.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('tax-rules')
export class TaxRulesController {
  constructor(private readonly service: TaxRulesService) {}

  @Post()
  @Permissions('taxRule.create')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateTaxRuleDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.create(dto, actorId);
  }

  @Get()
  @Permissions('taxRule.view')
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('taxCategoryId') taxCategoryId?: string,
    @Query('fiscalYear') fiscalYear?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.service.findAll({
      taxCategoryId,
      fiscalYear,
      activeOnly: activeOnly === 'true',
    });
  }

  @Get(':id')
  @Permissions('taxRule.view')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions('taxRule.update')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaxRuleDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.update(id, dto, actorId);
  }

  @Patch(':id/deactivate')
  @Permissions('taxRule.update')
  @HttpCode(HttpStatus.OK)
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.deactivate(id, actorId);
  }
}
