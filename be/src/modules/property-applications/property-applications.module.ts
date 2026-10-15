import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyApplicationEntity } from './entities/property-application.entity';
import { PropertyDocumentEntity } from './entities/property-document.entity';
import { PropertyEntity } from '../properties/entities/property.entity';
import { PropertyOwnershipEntity } from '../properties/entities/property-ownership.entity';
import { UsersEntity } from '../users/entities/users.entity';
import { PropertyApplicationsService } from './property-applications.service';
import { PropertyApplicationsController } from './property-applications.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';
import { EmployeeProfilesModule } from '../employee-profiles/employee-profiles.module';
import { DocumentStorageService } from '../../common/services/document-storage.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PropertyApplicationEntity,
      PropertyDocumentEntity,
      PropertyEntity,
      PropertyOwnershipEntity,
      UsersEntity,
    ]),
    NotificationsModule,
    AuditModule,
    EmployeeProfilesModule,
  ],
  controllers: [PropertyApplicationsController],
  providers: [PropertyApplicationsService, DocumentStorageService],
  exports: [PropertyApplicationsService],
})
export class PropertyApplicationsModule {}
