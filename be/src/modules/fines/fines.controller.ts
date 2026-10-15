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
import { FinesService } from './fines.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('fines')
export class FinesController {
  constructor(private readonly service: FinesService) {}

  @Post('bills/:billId/apply')
  @Permissions('fine.create')
  @HttpCode(HttpStatus.CREATED)
  async apply(
    @Param('billId', ParseUUIDPipe) billId: string,
    @Body() body: { periodLabel?: string },
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.applyToBill(
      billId,
      body.periodLabel ?? new Date().toISOString().slice(0, 7),
      actorId,
    );
  }

  @Get()
  @Permissions('fine.view')
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: { page?: number; limit?: number }) {
    return this.service.findAll(query);
  }

  @Get('bills/:billId')
  @Permissions('fine.view')
  @HttpCode(HttpStatus.OK)
  async findForBill(@Param('billId', ParseUUIDPipe) billId: string) {
    return this.service.findForBill(billId);
  }

  @Patch(':id/waive')
  @Permissions('fine.update')
  @HttpCode(HttpStatus.OK)
  async waive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason: string },
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.waive(id, body.reason, actorId);
  }
}
