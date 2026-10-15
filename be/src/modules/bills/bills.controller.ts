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
import { BillsService } from './bills.service';
import {
  AmendBillDto,
  BulkIssueDto,
  CancelBillDto,
  CreateBillDto,
} from './dto/bill.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BillStatusEnum } from '../../common/enums/bill-status.enum';

@Controller('bills')
export class BillsController {
  constructor(private readonly service: BillsService) {}

  @Post()
  @Permissions('bill.create')
  @HttpCode(HttpStatus.CREATED)
  async issue(@Body() dto: CreateBillDto, @CurrentUser('id') id: string) {
    return this.service.issue(dto, id);
  }

  @Post('bulk')
  @Permissions('bill.create')
  @HttpCode(HttpStatus.CREATED)
  async bulk(@Body() dto: BulkIssueDto, @CurrentUser('id') id: string) {
    return this.service.bulkIssue(dto, id);
  }

  @Get('my')
  @Permissions('bill.view')
  @HttpCode(HttpStatus.OK)
  async findMine(@CurrentUser('id') userId: string) {
    return this.service.findMine(userId);
  }

  @Get()
  @Permissions('bill.view')
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query()
    query: {
      page?: number;
      limit?: number;
      status?: BillStatusEnum;
      fiscalYear?: string;
      taxCategoryId?: string;
      overdueOnly?: string;
    },
    @CurrentUser('id') userId: string,
    @CurrentUser('permissions') permissions: string[],
  ) {
    const staff =
      (permissions ?? []).includes('bill.viewAll') ||
      (permissions ?? []).includes('report.view');
    // Citizens without staff-wide scope only see their own bills.
    return this.service.findAll({
      ...query,
      overdueOnly: query.overdueOnly === 'true' ? true : undefined,
      userId: staff
        ? (query['userId' as keyof typeof query] as unknown as string)
        : userId,
    });
  }

  @Get(':id')
  @Permissions('bill.view')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('permissions') permissions: string[],
  ) {
    const staff = (permissions ?? []).includes('report.view');
    return this.service.findOne(id, userId, staff);
  }

  @Patch(':id/amend')
  @Permissions('bill.update')
  @HttpCode(HttpStatus.OK)
  async amend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AmendBillDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.amend(id, dto, actorId);
  }

  @Patch(':id/cancel')
  @Permissions('bill.delete')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBillDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.cancel(id, dto, actorId);
  }

  @Post('mark-overdue')
  @Permissions('bill.update')
  @HttpCode(HttpStatus.OK)
  async markOverdue() {
    const count = await this.service.markOverdue();
    return { marked: count };
  }
}
