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
  Query,
} from '@nestjs/common';
import { TaxAssessmentsService } from '../services/tax-assessments.service';
import { CreateTaxAssessmentDto } from '../dto/create-tax-assessment.dto';
import { UpdateTaxAssessmentDto } from '../dto/update-tax-assessment.dto';
import { QueryTaxAssessmentDto } from '../dto/query-tax-assessment.dto';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('tax-assessments')
export class TaxAssessmentsController {
  constructor(private readonly service: TaxAssessmentsService) {}

  @Post()
  @Permissions('propertyTax.create')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateTaxAssessmentDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.create(dto, actorId);
  }

  @Get()
  @Permissions('propertyTax.view')
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: QueryTaxAssessmentDto) {
    return this.service.findAll(query);
  }

  @Get('user/:userId')
  @Permissions('propertyTax.view')
  @HttpCode(HttpStatus.OK)
  async findByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser('id') requesterId: string,
    @CurrentUser('permissions') permissions: string[],
  ) {
    const staff = (permissions ?? []).includes('report.view');
    return this.service.findByUser(userId, requesterId, staff);
  }

  @Get(':id')
  @Permissions('propertyTax.view')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') requesterId: string,
    @CurrentUser('permissions') permissions: string[],
  ) {
    const staff = (permissions ?? []).includes('report.view');
    return this.service.findOne(id, requesterId, staff);
  }

  @Patch(':id')
  @Permissions('propertyTax.update')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaxAssessmentDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.update(id, dto, actorId);
  }

  @Delete(':id')
  @Permissions('propertyTax.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.remove(id);
  }
}
