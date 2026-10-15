import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @Permissions('citizen.view')
  @HttpCode(HttpStatus.OK)
  async findAll(@CurrentUser('id') userId: string) {
    return this.service.findAllForUser(userId);
  }

  @Patch(':id/read')
  @Permissions('citizen.view')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.markAsRead(id, userId);
  }

  @Patch('read-all')
  @Permissions('citizen.view')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.service.markAllAsRead(userId);
  }

  @Get('unread-count')
  @Permissions('citizen.view')
  @HttpCode(HttpStatus.OK)
  async unreadCount(@CurrentUser('id') userId: string) {
    const count = await this.service.countUnread(userId);
    return { count };
  }
}
