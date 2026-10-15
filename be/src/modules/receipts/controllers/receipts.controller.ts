import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ReceiptsService } from '../services/receipts.service';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly service: ReceiptsService) {}

  @Get('my')
  @Permissions('receipt.view')
  @HttpCode(HttpStatus.OK)
  async findMine(@CurrentUser('id') userId: string) {
    return this.service.findByUserId(userId);
  }

  @Get()
  @Permissions('receipt.view')
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: { page?: number; limit?: number; userId?: string },
    @CurrentUser('id') userId: string,
    @CurrentUser('permissions') permissions: string[],
  ) {
    const staff = (permissions ?? []).includes('report.view');
    return this.service.findAll({
      ...query,
      userId: staff ? query.userId : userId,
    });
  }

  @Get(':id')
  @Permissions('receipt.view')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('permissions') permissions: string[],
  ) {
    const receipt = await this.service.findOne(id);
    const staff = (permissions ?? []).includes('report.view');
    if (!staff && receipt.userId !== userId) {
      throw new ForbiddenException(
        'You cannot view another citizen\u2019s receipt',
      );
    }
    return receipt;
  }
}
