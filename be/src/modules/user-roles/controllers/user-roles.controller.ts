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
  UseGuards,
} from '@nestjs/common';
import { UserRolesService } from '../services/user-roles.service';
import { AssignUserRoleDto } from '../dto/assign-user-role.dto';
import { AssignMultipleRolesDto } from '../dto/assign-multiple-roles.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';

@Controller('user-roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UserRolesController {
  constructor(private readonly userRolesService: UserRolesService) {}

  @Post()
  @Permissions('user.assign')
  @HttpCode(HttpStatus.CREATED)
  async assignRole(@Body() dto: AssignUserRoleDto) {
    return this.userRolesService.assignRole(dto);
  }

  @Post('bulk')
  @Permissions('user.assign')
  @HttpCode(HttpStatus.CREATED)
  async assignMultipleRoles(@Body() dto: AssignMultipleRolesDto) {
    return this.userRolesService.assignMultipleRoles(dto);
  }

  @Post('sync')
  @Permissions('user.assign')
  @HttpCode(HttpStatus.OK)
  async syncRoles(@Body() dto: AssignMultipleRolesDto) {
    return this.userRolesService.syncRoles(dto);
  }

  @Delete(':userId/:roleId')
  @Permissions('user.remove')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeRole(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ): Promise<void> {
    return this.userRolesService.removeRole({ userId, roleId });
  }

  @Get('user/:userId')
  @Permissions('user.view')
  @HttpCode(HttpStatus.OK)
  async findRolesByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.userRolesService.findRolesByUser(userId);
  }

  @Get('role/:roleId')
  @Permissions('role.view')
  @HttpCode(HttpStatus.OK)
  async findUsersByRole(@Param('roleId', ParseUUIDPipe) roleId: string) {
    return this.userRolesService.findUsersByRole(roleId);
  }

  @Get('user/:userId/role/:roleId/check')
  @Permissions('user.view')
  @HttpCode(HttpStatus.OK)
  async userHasRole(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ): Promise<{ hasRole: boolean }> {
    const hasRole = await this.userRolesService.userHasRole(userId, roleId);
    return { hasRole };
  }
}
