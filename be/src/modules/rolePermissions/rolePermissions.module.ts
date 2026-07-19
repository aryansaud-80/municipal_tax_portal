import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsEntity } from '../permissions/entities/permissions.entity';
import { RolesEntity } from '../roles/entities/roles.entity';
import { RolePermissionsEntity } from './entities/rolePermissions.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      RolePermissionsEntity,
      RolesEntity,
      PermissionsEntity,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class RolePermissionsModule {}
