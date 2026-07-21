import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionsEntity } from '../entities/permissions.entity';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { QueryPermissionDto } from '../dto/query-permission.dto';
import { PermissionModule } from '../enums/permission-module.enum';
import { SortOrder } from '../../../common/enums/sort-order.enum';
import { findEntityOrFail } from '../../../common/utils/find-or-fail.util';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(PermissionsEntity)
    private readonly permissionRepository: Repository<PermissionsEntity>,
  ) {}

  async create(pDto: CreatePermissionDto): Promise<PermissionsEntity> {
    await this.checkUniqueFields(pDto);
    const permission = this.permissionRepository.create(pDto);
    return this.permissionRepository.save(permission);
  }

  async findAll(query: QueryPermissionDto): Promise<{
    data: PermissionsEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { module, action, name, code, search, page = 1, limit = 10 } = query;

    const qb = this.permissionRepository.createQueryBuilder('permission');

    if (module) {
      qb.andWhere('permission.module = :module', { module });
    }
    if (action) {
      qb.andWhere('permission.action = :action', { action });
    }
    if (name) {
      qb.andWhere('permission.name = :name', { name });
    }
    if (code) {
      qb.andWhere('permission.code = :code', { code });
    }
    if (search) {
      qb.andWhere(
        '(permission.name ILIKE :search OR permission.code ILIKE :search OR permission.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<PermissionsEntity> {
    return findEntityOrFail(
      this.permissionRepository,
      { id },
      'Permission',
      id,
      { relations: { rolePermissions: true } },
    );
  }

  async update(
    id: string,
    pDto: UpdatePermissionDto,
  ): Promise<PermissionsEntity> {
    const permission = await this.findOne(id);

    if (pDto.name || pDto.code) {
      await this.checkUniqueFields(pDto as CreatePermissionDto, id);
    }

    Object.assign(permission, pDto);
    return this.permissionRepository.save(permission);
  }

  async remove(id: string): Promise<void> {
    const permission = await this.findOne(id);
    await this.permissionRepository.remove(permission);
  }

  async findByCode(code: string): Promise<PermissionsEntity> {
    return findEntityOrFail(
      this.permissionRepository,
      { code },
      'Permission',
      code,
    );
  }

  async findByModule(module: PermissionModule): Promise<PermissionsEntity[]> {
    return this.permissionRepository.find({
      where: { module },
      order: { action: SortOrder.ASC },
    });
  }

  private async checkUniqueFields(
    pDto: CreatePermissionDto,
    excludeId?: string,
  ): Promise<void> {
    const existingPermission = await this.permissionRepository.findOne({
      where: [{ name: pDto.name }, { code: pDto.code }],
    });

    if (existingPermission && existingPermission.id !== excludeId) {
      if (existingPermission.name === pDto.name) {
        throw new ConflictException(
          `Permission with name '${pDto.name}' already exists.`,
        );
      }
      if (existingPermission.code === pDto.code) {
        throw new ConflictException(
          `Permission with code '${pDto.code}' already exists.`,
        );
      }
    }
  }
}
