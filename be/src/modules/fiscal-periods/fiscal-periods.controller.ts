import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { FiscalPeriodsService } from './fiscal-periods.service';
import { CreateFiscalPeriodDto } from './dto/create-fiscal-period.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('fiscal-periods')
export class FiscalPeriodsController {
  constructor(private readonly service: FiscalPeriodsService) {}

  @Post()
  @Permissions('fiscalPeriod.create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateFiscalPeriodDto) {
    return this.service.create(dto);
  }

  @Get()
  @Permissions('fiscalPeriod.view')
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Permissions('fiscalPeriod.view')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  @Permissions('fiscalPeriod.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.remove(id);
  }
}
