import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRoleEntity } from '../user-roles/entities/user-role.entity';
import { RolePermissionsEntity } from '../rolePermissions/entities/rolePermissions.entity';
import { RolesEntity } from './entities/roles.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      RolesEntity,
      UserRoleEntity,
      RolePermissionsEntity,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class RolesModule {}
