import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRoleEntity } from '../user-roles/entities/user-role.entity';
import { RolePermissionsEntity } from '../rolePermissions/entities/rolePermissions.entity';
import { RolesEntity } from './entities/roles.entity';
import { RolesService } from './services/roles.services';
import { RolesController } from './controllers/roles.controller';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      RolesEntity,
      UserRoleEntity,
      RolePermissionsEntity,
    ]),
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService, TypeOrmModule],
})
export class RolesModule {}
