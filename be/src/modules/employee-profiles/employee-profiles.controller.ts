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
import { EmployeeProfilesService } from './employee-profiles.service';
import { UpsertEmployeeProfileDto } from './dto/upsert-employee-profile.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('employee-profiles')
export class EmployeeProfilesController {
  constructor(private readonly service: EmployeeProfilesService) {}

  @Get()
  @Permissions('user.view')
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return this.service.findAll();
  }

  @Post()
  @Permissions('user.assign')
  @HttpCode(HttpStatus.OK)
  async upsert(
    @Body() dto: UpsertEmployeeProfileDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('roles') roles: string[],
  ) {
    return this.service.upsert(dto, actorId, roles ?? []);
  }

  @Delete(':userId')
  @Permissions('user.remove')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('userId', ParseUUIDPipe) userId: string): Promise<void> {
    return this.service.removeByUser(userId);
  }
}
