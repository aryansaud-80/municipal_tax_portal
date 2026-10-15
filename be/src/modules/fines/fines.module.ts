import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FineAssessmentEntity } from './entities/fine-assessment.entity';
import { BillEntity } from '../bills/entities/bill.entity';
import { FinesService } from './fines.service';
import { FinesController } from './fines.controller';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FineAssessmentEntity, BillEntity]),
    AuditModule,
    NotificationsModule,
  ],
  controllers: [FinesController],
  providers: [FinesService],
  exports: [FinesService],
})
export class FinesModule {}
