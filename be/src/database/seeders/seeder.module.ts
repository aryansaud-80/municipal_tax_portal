import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import jwtConfig from '../../config/jwt.config';
import appConfig from '../../config/app.config';
import { dataSourceOptions } from '../data-source';
import { PermissionSeeder } from './permissions/permission.seeder';
import { RoleSeeder } from './roles/role.seeder';
import { SuperAdminSeeder } from './users/super-admin.seeder';
import { RolePermissionSeeder } from './mappings/role-permission.seeder';
import { UserRoleSeeder } from './mappings/user-role.seeder';
import { DatabaseSeeder } from './database.seeder';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [jwtConfig, appConfig] }),
    TypeOrmModule.forRoot(dataSourceOptions),
  ],
  providers: [
    PermissionSeeder,
    RoleSeeder,
    SuperAdminSeeder,
    RolePermissionSeeder,
    UserRoleSeeder,
    DatabaseSeeder,
  ],
})
export class SeederModule {}
