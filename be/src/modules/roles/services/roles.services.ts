import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolesEntity } from '../entities/roles.entity';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { QueryRoleDto } from '../dto/query-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RolesEntity)
    private readonly rolesRepository: Repository<RolesEntity>,
  ) {}

  async create(rDto: CreateRoleDto): Promise<RolesEntity> {
    await this.checkUniqueFields(rDto);
    const role = this.rolesRepository.create(rDto);
    return this.rolesRepository.save(role);
  }

  async findAll(query: QueryRoleDto): Promise<{
    data: RolesEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      name,
      code,
      search,
      isActive,
      isSystem,
      sortOrder = 'ASC',
      page = 1,
      limit = 10,
    } = query;

    const qb = this.rolesRepository.createQueryBuilder('role');

    if (name) {
      qb.andWhere('role.name = :name', { name });
    }

    if (code) {
      qb.andWhere('role.code = :code', { code });
    }

    if (search) {
      qb.andWhere(
        '(role.name ILIKE :search OR role.code ILIKE :search OR role.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (isActive !== undefined) {
      qb.andWhere('role.isActive = :isActive', { isActive });
    }

    if (isSystem !== undefined) {
      qb.andWhere('role.isSystem = :isSystem', { isSystem });
    }

    qb.orderBy('role.name', sortOrder);

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<RolesEntity> {
    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: { userRoles: true, rolePermissions: true },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${id}' not found.`);
    }

    return role;
  }

  async update(id: string, rDto: UpdateRoleDto): Promise<RolesEntity> {
    const role = await this.findOne(id);
    Object.assign(role, rDto);
    return this.rolesRepository.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    this.assertDeletable(role);
    await this.rolesRepository.softRemove(role);
  }

  async findByCode(code: string): Promise<RolesEntity> {
    const role = await this.rolesRepository.findOne({
      where: { code },
      relations: { userRoles: true, rolePermissions: true },
    });

    if (!role) {
      throw new NotFoundException(`Role with code '${code}' not found.`);
    }

    return role;
  }

  async findByName(name: string): Promise<RolesEntity> {
    const role = await this.rolesRepository.findOne({
      where: { name },
      relations: { userRoles: true, rolePermissions: true },
    });

    if (!role) {
      throw new NotFoundException(`Role with name '${name}' not found.`);
    }

    return role;
  }

  async toggleStatus(id: string): Promise<RolesEntity> {
    const role = await this.findOne(id);
    role.isActive = !role.isActive;
    return this.rolesRepository.save(role);
  }

  private async checkUniqueFields(
    rDto: CreateRoleDto,
    excludeId?: string,
  ): Promise<void> {
    const existingRole = await this.rolesRepository.findOne({
      where: [{ name: rDto.name }, { code: rDto.code }],
    });

    if (existingRole && existingRole.id !== excludeId) {
      if (existingRole.name === rDto.name) {
        throw new ConflictException(
          `Role with name '${rDto.name}' already exists.`,
        );
      }
      if (existingRole.code === rDto.code) {
        throw new ConflictException(
          `Role with code '${rDto.code}' already exists.`,
        );
      }
    }
  }

  private assertDeletable(role: RolesEntity): void {
    if (role.userRoles && role.userRoles.length > 0) {
      throw new ConflictException(
        `Role with ID '${role.id}' cannot be deleted because it is assigned to users.`,
      );
    }

    if (role.rolePermissions && role.rolePermissions.length > 0) {
      throw new ConflictException(
        `Role with ID '${role.id}' cannot be deleted because it has associated permissions.`,
      );
    }
  }
}
