import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsEntity } from '../permissions/entities/permissions.entity';
import { RolesEntity } from '../roles/entities/roles.entity';
import { RolePermissionsEntity } from './entities/rolePermissions.entity';
import { RolePermissionsController } from './controllers/role-permissions.controller';
import { RolePermissionsService } from './services/role-permissions.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      RolePermissionsEntity,
      RolesEntity,
      PermissionsEntity,
    ]),
  ],
  providers: [RolePermissionsService],
  controllers: [RolePermissionsController],
  exports: [RolePermissionsService, TypeOrmModule],
})
export class RolePermissionsModule {}
