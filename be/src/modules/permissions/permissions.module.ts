import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolePermissionsEntity } from '../rolePermissions/entities/rolePermissions.entity';
import { PermissionsEntity } from './entities/permissions.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([PermissionsEntity, RolePermissionsEntity]),
  ],
  exports: [TypeOrmModule],
})
export class PermissionsModule {}
