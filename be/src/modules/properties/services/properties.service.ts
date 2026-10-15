import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { PropertyEntity } from '../entities/property.entity';
import { PropertyOwnershipEntity } from '../entities/property-ownership.entity';
import { CreatePropertyDto } from '../dto/create-property.dto';
import { UpdatePropertyDto } from '../dto/update-property.dto';
import {
  QueryPropertyDto,
  PropertySortableField,
} from '../dto/query-property.dto';
import { findEntityOrFail } from '../../../common/utils/find-or-fail.util';
import { SortOrder } from '../../../common/enums/sort-order.enum';
import { PropertyStatusEnum } from '../../../common/enums/property-status.enum';
import { VerificationStatusEnum } from '../../../common/enums/verification-status.enum';

const ALIAS = 'property';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(PropertyEntity)
    private readonly repo: Repository<PropertyEntity>,
    @InjectRepository(PropertyOwnershipEntity)
    private readonly ownershipRepo: Repository<PropertyOwnershipEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreatePropertyDto): Promise<PropertyEntity> {
    // Staff-assisted registration does NOT imply verified legal ownership.
    const propertyNumber = await this.generatePropertyNumber();
    const entity = this.repo.create({
      ...dto,
      propertyNumber,
      verificationStatus: VerificationStatusEnum.UNVERIFIED,
    });
    const saved = await this.repo.save(entity);
    if (dto.userId) {
      await this.ownershipRepo.save(
        this.ownershipRepo.create({
          propertyId: saved.id,
          userId: dto.userId,
          sharePercent: 100,
          acquisitionType: 'staff_registration',
        }),
      );
    }
    return saved;
  }

  async createForUser(
    dto: CreatePropertyDto,
    userId: string,
  ): Promise<PropertyEntity> {
    const propertyNumber = await this.generatePropertyNumber();
    const entity = this.repo.create({
      ...dto,
      userId,
      propertyNumber,
      verificationStatus: VerificationStatusEnum.UNVERIFIED,
    });
    const saved = await this.repo.save(entity);
    await this.ownershipRepo.save(
      this.ownershipRepo.create({
        propertyId: saved.id,
        userId,
        sharePercent: 100,
        acquisitionType: 'staff_registration',
      }),
    );
    return saved;
  }

  async findAll(query: QueryPropertyDto) {
    const qb = this.buildQuery(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    qb.skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(
    id: string,
    requesterId?: string,
    staff = false,
  ): Promise<PropertyEntity> {
    const entity = await findEntityOrFail(this.repo, { id }, 'Property', id);
    if (!staff && requesterId && entity.userId !== requesterId) {
      const coOwned = await this.ownershipRepo.findOne({
        where: { propertyId: id, userId: requesterId, isCurrent: true },
      });
      if (!coOwned) {
        throw new ForbiddenException(
          'You cannot view another citizen\u2019s property',
        );
      }
    }
    return entity;
  }

  /** Ownership transfer: history preserved, property liabilities stay attached. */
  async transferOwnership(
    propertyId: string,
    newUserId: string,
    sharePercent: number,
    recordedBy: string,
    notes?: string,
  ): Promise<PropertyOwnershipEntity> {
    if (!(sharePercent > 0) || sharePercent > 100) {
      throw new ForbiddenException('Share must be between 0 and 100');
    }
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      const property = await runner.manager.findOne(PropertyEntity, {
        where: { id: propertyId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!property)
        throw new NotFoundException(`Property '${propertyId}' not found`);
      await runner.manager.update(
        PropertyOwnershipEntity,
        { propertyId, isCurrent: true },
        { isCurrent: false, releasedAt: new Date() },
      );
      const record = await runner.manager.save(
        runner.manager.create(PropertyOwnershipEntity, {
          propertyId,
          userId: newUserId,
          sharePercent,
          acquisitionType: 'transfer',
          recordedBy,
          notes,
        }),
      );
      property.userId = newUserId;
      await runner.manager.save(property);
      await runner.commitTransaction();
      return record;
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }

  async ownershipHistory(
    propertyId: string,
  ): Promise<PropertyOwnershipEntity[]> {
    return this.ownershipRepo.find({
      where: { propertyId },
      relations: { user: true },
      order: { acquiredAt: 'DESC' },
    });
  }

  async findByUserId(userId: string): Promise<PropertyEntity[]> {
    return this.repo.find({ where: { userId } });
  }

  async update(id: string, dto: UpdatePropertyDto): Promise<PropertyEntity> {
    const entity = await findEntityOrFail(this.repo, { id }, 'Property', id);
    // Verification lifecycle is owned by the application review flow —
    // plain edits must not flip verification or reassign ownership silently.
    const safe = { ...dto } as Record<string, unknown>;
    delete safe.userId;
    delete safe.verificationStatus;
    delete safe.verifiedBy;
    delete safe.verifiedAt;
    Object.assign(entity, safe);
    return this.repo.save(entity);
  }

  async remove(id: string): Promise<void> {
    await findEntityOrFail(this.repo, { id }, 'Property', id);
    await this.repo.softDelete(id);
  }

  async toggleStatus(
    id: string,
    status: PropertyEntity['status'],
  ): Promise<PropertyEntity> {
    const entity = await findEntityOrFail(this.repo, { id }, 'Property', id);
    entity.status = status;
    return this.repo.save(entity);
  }

  async count(): Promise<number> {
    return this.repo.count({ where: { status: PropertyStatusEnum.ACTIVE } });
  }

  private async generatePropertyNumber(): Promise<string> {
    const count = await this.repo.count();
    const num = count + 1;
    return `PROP-${String(num).padStart(6, '0')}`;
  }

  private buildQuery(
    query: QueryPropertyDto,
  ): SelectQueryBuilder<PropertyEntity> {
    const qb = this.repo.createQueryBuilder(ALIAS);

    if (query.search) {
      qb.andWhere(
        `(${ALIAS}.property_number ILIKE :search OR ${ALIAS}.owner_name ILIKE :search OR ${ALIAS}.address ILIKE :search)`,
        { search: `%${query.search}%` },
      );
    }

    if (query.userId) {
      qb.andWhere(`${ALIAS}.user_id = :userId`, { userId: query.userId });
    }

    if (query.ward) {
      qb.andWhere(`${ALIAS}.ward = :ward`, { ward: query.ward });
    }

    if (query.status) {
      qb.andWhere(`${ALIAS}.status = :status`, { status: query.status });
    }

    if (query.propertyType) {
      qb.andWhere(`${ALIAS}.property_type = :propertyType`, {
        propertyType: query.propertyType,
      });
    }

    const sortBy = query.sortBy ?? PropertySortableField.CREATED_AT;
    const sortOrder = query.sortOrder ?? SortOrder.DESC;
    qb.orderBy(`${ALIAS}.${sortBy}`, sortOrder);

    return qb;
  }
}
