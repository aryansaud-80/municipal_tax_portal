import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeProfileEntity } from './entities/employee-profile.entity';
import { UserRoleEntity } from '../user-roles/entities/user-role.entity';
import { RolePermissionsEntity } from '../rolePermissions/entities/rolePermissions.entity';
import { EmployeeProfilesService } from './employee-profiles.service';
import { EmployeeProfilesController } from './employee-profiles.controller';
import { PermissionsCheckerService } from '../../common/services/permission-checker.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmployeeProfileEntity,
      UserRoleEntity,
      RolePermissionsEntity,
    ]),
    AuditModule,
  ],
  controllers: [EmployeeProfilesController],
  providers: [EmployeeProfilesService, PermissionsCheckerService],
  exports: [EmployeeProfilesService],
})
export class EmployeeProfilesModule {}
