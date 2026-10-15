import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PropertyApplicationEntity } from './entities/property-application.entity';
import { PropertyDocumentEntity } from './entities/property-document.entity';
import { PropertyEntity } from '../properties/entities/property.entity';
import { PropertyOwnershipEntity } from '../properties/entities/property-ownership.entity';
import { CreatePropertyApplicationDto } from './dto/create-property-application.dto';
import {
  ReviewApplicationDto,
  ReviewDecision,
} from './dto/review-application.dto';
import { PropertyApplicationStatusEnum } from '../../common/enums/property-application-status.enum';
import { VerificationStatusEnum } from '../../common/enums/verification-status.enum';
import { NotificationsService } from '../notifications/services/notifications.service';
import { NotificationTypeEnum } from '../../common/enums/notification-type.enum';
import { AuditService } from '../audit/audit.service';
import { EmployeeProfilesService } from '../employee-profiles/employee-profiles.service';
import { DocumentStorageService } from '../../common/services/document-storage.service';

@Injectable()
export class PropertyApplicationsService {
  constructor(
    @InjectRepository(PropertyApplicationEntity)
    private readonly repo: Repository<PropertyApplicationEntity>,
    @InjectRepository(PropertyDocumentEntity)
    private readonly docRepo: Repository<PropertyDocumentEntity>,
    private readonly dataSource: DataSource,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
    private readonly employees: EmployeeProfilesService,
    private readonly storage: DocumentStorageService,
  ) {}

  async submit(
    dto: CreatePropertyApplicationDto,
    applicantUserId: string,
    submittedByStaffId?: string,
  ): Promise<PropertyApplicationEntity> {
    const targetUserId = dto.applicantUserId ?? applicantUserId;
    if (
      dto.applicantUserId &&
      dto.applicantUserId !== applicantUserId &&
      !submittedByStaffId
    ) {
      throw new ForbiddenException(
        'Only staff may file on behalf of another citizen',
      );
    }
    const count = await this.repo.count();
    return this.repo.save(
      this.repo.create({
        ...dto,
        applicantUserId: targetUserId,
        floorCount: dto.floorCount ?? 1,
        applicationNumber: `APP-${String(count + 1).padStart(6, '0')}`,
        status: PropertyApplicationStatusEnum.PENDING,
        submittedByStaffId,
      }),
    );
  }

  async findMine(userId: string): Promise<PropertyApplicationEntity[]> {
    return this.repo.find({
      where: { applicantUserId: userId },
      relations: { documents: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    status?: PropertyApplicationStatusEnum;
    ward?: number;
  }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 100);
    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.applicant', 'applicant')
      .leftJoinAndSelect('a.documents', 'documents')
      .orderBy('a.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (query.status)
      qb.andWhere('a.status = :status', { status: query.status });
    if (query.ward) qb.andWhere('a.ward = :ward', { ward: query.ward });
    const [data, total] = await qb.getManyAndCount();
    const sanitized = data.map((row) => ({
      ...row,
      applicant: row.applicant
        ? {
            id: row.applicant.id,
            firstName: row.applicant.firstName,
            lastName: row.applicant.lastName,
            email: row.applicant.email,
          }
        : null,
    }));
    return {
      data: sanitized,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(
    id: string,
    requesterId?: string,
    staff = false,
  ): Promise<PropertyApplicationEntity> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: { documents: true, applicant: true },
    });
    if (!entity) throw new NotFoundException(`Application '${id}' not found`);
    if (!staff && requesterId && entity.applicantUserId !== requesterId) {
      throw new ForbiddenException(
        'You cannot view another citizen\u2019s application',
      );
    }
    return entity;
  }

  async review(
    id: string,
    dto: ReviewApplicationDto,
    reviewerId: string,
  ): Promise<PropertyApplicationEntity> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      const app = await runner.manager.findOne(PropertyApplicationEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!app) throw new NotFoundException(`Application '${id}' not found`);
      if (
        app.status === PropertyApplicationStatusEnum.APPROVED &&
        dto.decision === ReviewDecision.APPROVE
      ) {
        throw new BadRequestException('Application is already approved');
      }
      await this.employees.assertWardAccess(reviewerId, app.ward);

      if (dto.decision === ReviewDecision.REQUEST_CORRECTION) {
        if (!dto.reviewNotes) {
          throw new BadRequestException(
            'A reason is required when requesting corrections',
          );
        }
        app.status = PropertyApplicationStatusEnum.CORRECTION_REQUESTED;
        app.reviewNotes = dto.reviewNotes;
      } else if (dto.decision === ReviewDecision.REJECT) {
        if (!dto.reviewNotes) {
          throw new BadRequestException('A reason is required when rejecting');
        }
        app.status = PropertyApplicationStatusEnum.REJECTED;
        app.reviewNotes = dto.reviewNotes;
      } else {
        // Approve: create the verified property + ownership inside the txn.
        const propCount = await runner.manager.count(PropertyEntity);
        const property = await runner.manager.save(
          runner.manager.create(PropertyEntity, {
            propertyNumber: `PROP-${String(propCount + 1).padStart(6, '0')}`,
            userId: app.applicantUserId,
            ownerName: app.ownerName,
            address: app.address,
            ward: app.ward,
            tole: app.tole,
            areaSqMeters: app.areaSqMeters,
            propertyType: app.propertyType,
            landOwnershipNumber: app.landOwnershipNumber,
            floorCount: app.floorCount,
            buildingAgeYears: app.buildingAgeYears,
            verificationStatus: VerificationStatusEnum.VERIFIED,
            verifiedBy: reviewerId,
            verifiedAt: new Date(),
          }),
        );
        await runner.manager.save(
          runner.manager.create(PropertyOwnershipEntity, {
            propertyId: property.id,
            userId: app.applicantUserId,
            sharePercent: 100,
            acquisitionType: 'registration',
            recordedBy: reviewerId,
          }),
        );
        if (app.propertyId && app.propertyId !== property.id) {
          // Re-verification of an existing property record.
          await runner.manager.update(PropertyEntity, app.propertyId, {
            verificationStatus: VerificationStatusEnum.VERIFIED,
            verifiedBy: reviewerId,
            verifiedAt: new Date(),
          });
        }
        app.status = PropertyApplicationStatusEnum.APPROVED;
        app.reviewNotes = dto.reviewNotes;
        app.propertyId = property.id;
        // Link any uploaded docs to the new property.
        await runner.manager.update(
          PropertyDocumentEntity,
          { applicationId: app.id },
          { propertyId: property.id },
        );
      }
      app.reviewedBy = reviewerId;
      app.reviewedAt = new Date();
      const saved = await runner.manager.save(app);
      await runner.commitTransaction();

      await this.audit.record(
        'property-application.review',
        'property-application',
        saved.id,
        {
          decision: dto.decision,
          notes: dto.reviewNotes,
        },
        reviewerId,
      );
      const titles: Record<ReviewDecision, string> = {
        [ReviewDecision.APPROVE]: 'Property application approved',
        [ReviewDecision.REJECT]: 'Property application rejected',
        [ReviewDecision.REQUEST_CORRECTION]:
          'Corrections requested for your application',
      };
      await this.notifications.create({
        userId: app.applicantUserId,
        title: titles[dto.decision],
        message:
          dto.reviewNotes ??
          `Application ${app.applicationNumber}: ${dto.decision}`,
        type:
          dto.decision === ReviewDecision.APPROVE
            ? NotificationTypeEnum.SUCCESS
            : NotificationTypeEnum.WARNING,
        link: '/properties',
      });
      return saved;
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }

  async resubmit(
    id: string,
    dto: CreatePropertyApplicationDto,
    requesterId: string,
  ): Promise<PropertyApplicationEntity> {
    const app = await this.findOne(id, requesterId, false);
    if (
      app.status !== PropertyApplicationStatusEnum.CORRECTION_REQUESTED &&
      app.status !== PropertyApplicationStatusEnum.REJECTED
    ) {
      throw new BadRequestException(
        'Only correction-requested or rejected applications can be resubmitted',
      );
    }
    Object.assign(app, {
      ownerName: dto.ownerName,
      address: dto.address,
      ward: dto.ward,
      tole: dto.tole,
      areaSqMeters: dto.areaSqMeters,
      propertyType: dto.propertyType,
      landOwnershipNumber: dto.landOwnershipNumber,
      floorCount: dto.floorCount ?? 1,
      buildingAgeYears: dto.buildingAgeYears,
      status: PropertyApplicationStatusEnum.PENDING,
      resubmissionCount: app.resubmissionCount + 1,
    });
    return this.repo.save(app);
  }

  async attachDocument(
    applicationId: string,
    file: { buffer: Buffer; originalName: string; mimeType: string },
    uploaderId: string,
    staff = false,
  ): Promise<PropertyDocumentEntity> {
    const app = await this.findOne(applicationId, uploaderId, staff);
    if (
      app.status === PropertyApplicationStatusEnum.APPROVED &&
      app.propertyId
    ) {
      throw new BadRequestException('Application is already approved');
    }
    const stored = await this.storage.save(
      file.buffer,
      file.originalName,
      file.mimeType,
    );
    return this.docRepo.save(
      this.docRepo.create({
        applicationId: app.id,
        propertyId: app.propertyId,
        fileName: stored.fileName,
        storedPath: stored.storedPath,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        uploadedBy: uploaderId,
      }),
    );
  }

  async readDocument(
    documentId: string,
    requesterId: string,
    staff = false,
  ): Promise<{ buffer: Buffer; mimeType: string; fileName: string }> {
    const doc = await this.docRepo.findOne({
      where: { id: documentId },
      relations: { application: true },
    });
    if (!doc) throw new NotFoundException('Document not found');
    if (!staff) {
      const ownerId = doc.application?.applicantUserId ?? doc.uploadedBy;
      if (ownerId !== requesterId) {
        throw new ForbiddenException('You cannot access this document');
      }
    }
    const { buffer } = await this.storage.read(doc.storedPath);
    return { buffer, mimeType: doc.mimeType, fileName: doc.fileName };
  }
}
