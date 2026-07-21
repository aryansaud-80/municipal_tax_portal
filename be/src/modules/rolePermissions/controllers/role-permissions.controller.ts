import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RolePermissionsService } from '../services/role-permissions.service';
import { RolePermissionsEntity } from '../entities/rolePermissions.entity';
import { RolesEntity } from '../../roles/entities/roles.entity';
import { PermissionsEntity } from '../../permissions/entities/permissions.entity';
import { AssignRolePermissionsDto } from '../dto/assign-role-permission.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';

@Controller('role-permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolePermissionsController {
  constructor(
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  @Post()
  @Permissions('role.assign')
  async assignPermissions(
    @Body() dto: AssignRolePermissionsDto,
  ): Promise<RolePermissionsEntity[]> {
    return this.rolePermissionsService.assignPermissions(dto);
  }

  @Post('sync')
  @Permissions('role.assign')
  async syncPermissions(
    @Body() dto: AssignRolePermissionsDto,
  ): Promise<RolePermissionsEntity[]> {
    return this.rolePermissionsService.syncPermissions(dto);
  }

  @Delete(':roleId/:permissionId')
  @Permissions('role.remove')
  async removePermission(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
  ): Promise<RolePermissionsEntity[]> {
    return this.rolePermissionsService.removePermission({
      roleId,
      permissionIds: [permissionId],
    });
  }

  @Get('role/:roleId')
  @Permissions('role.view')
  async findPermissionsByRole(
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ): Promise<PermissionsEntity[]> {
    return this.rolePermissionsService.findPermissionsByRole(roleId);
  }

  @Get('permission/:permissionId')
  @Permissions('permission.view')
  async findRolesByPermission(
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
  ): Promise<RolesEntity[]> {
    return this.rolePermissionsService.findRolesByPermission(permissionId);
  }

  @Get('role/:roleId/permission/:permissionId/check')
  @Permissions('role.view')
  async roleHasPermission(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
  ): Promise<{ hasPermission: boolean }> {
    const hasPermission = await this.rolePermissionsService.roleHasPermission(
      roleId,
      permissionId,
    );
    return { hasPermission };
  }
}
