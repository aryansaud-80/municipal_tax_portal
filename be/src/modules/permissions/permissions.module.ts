import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolePermissionsEntity } from '../rolePermissions/entities/rolePermissions.entity';
import { PermissionsEntity } from './entities/permissions.entity';
import { PermissionsService } from './services/permissions.service';
import { PermissionsController } from './controllers/permissions.controller';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([PermissionsEntity, RolePermissionsEntity]),
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService, TypeOrmModule],
})
export class PermissionsModule {}
