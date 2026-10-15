import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeProfileEntity } from './entities/employee-profile.entity';
import { UpsertEmployeeProfileDto } from './dto/upsert-employee-profile.dto';
import { PermissionsCheckerService } from '../../common/services/permission-checker.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class EmployeeProfilesService {
  constructor(
    @InjectRepository(EmployeeProfileEntity)
    private readonly repo: Repository<EmployeeProfileEntity>,
    private readonly permissions: PermissionsCheckerService,
    private readonly audit: AuditService,
  ) {}

  findAll(): Promise<EmployeeProfileEntity[]> {
    return this.repo.find({
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: string): Promise<EmployeeProfileEntity | null> {
    return this.repo.findOne({ where: { userId } });
  }

  /** Enforce ward scope: empty wardAssignments means all wards. */
  async assertWardAccess(userId: string, ward?: number): Promise<void> {
    if (ward == null) return;
    const roles = await this.permissions.getUserRoleNames(userId);
    if (roles.includes('Super Admin') || roles.includes('Municipal Admin'))
      return;
    const profile = await this.findByUser(userId);
    if (!profile || profile.wardAssignments.length === 0) return;
    if (!profile.wardAssignments.includes(ward)) {
      throw new ForbiddenException(
        `Access restricted: ward ${ward} is outside your assignment`,
      );
    }
  }

  async upsert(
    dto: UpsertEmployeeProfileDto,
    actorId: string,
    actorRoles: string[],
  ): Promise<EmployeeProfileEntity> {
    if (dto.userId === actorId) {
      throw new ForbiddenException(
        'You cannot modify your own employee profile',
      );
    }
    const isSuper = actorRoles.includes('Super Admin');
    if (!isSuper && dto.userId) {
      const targetRoles = await this.permissions.getUserRoleNames(dto.userId);
      if (
        targetRoles.includes('Super Admin') ||
        targetRoles.includes('Municipal Admin')
      ) {
        throw new ForbiddenException(
          'Only a Super Admin can manage administrator profiles',
        );
      }
    }
    let entity = await this.findByUser(dto.userId);
    if (!entity) {
      entity = this.repo.create({
        ...dto,
        wardAssignments: dto.wardAssignments ?? [],
      });
    } else {
      Object.assign(entity, {
        position: dto.position ?? entity.position,
        wardAssignments: dto.wardAssignments ?? entity.wardAssignments,
        canVerifyPayments: dto.canVerifyPayments ?? entity.canVerifyPayments,
        canAssess: dto.canAssess ?? entity.canAssess,
        canApproveProperty: dto.canApproveProperty ?? entity.canApproveProperty,
      });
    }
    const saved = await this.repo.save(entity);
    await this.audit.record(
      'employee-profile.upsert',
      'employee-profile',
      saved.id,
      { userId: dto.userId },
      actorId,
    );
    return saved;
  }

  async removeByUser(userId: string): Promise<void> {
    const entity = await this.findByUser(userId);
    if (!entity) throw new NotFoundException('Employee profile not found');
    await this.repo.softDelete(entity.id);
  }
}
