import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersEntity } from '../entities/users.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { QueryUserDto } from '../dto/query-user.dto';
import { PaginatedUsersResponseDto } from '../dto/paginated-users-response.dto';
import { UserStatusEnum } from '../enums/user-status.enum';
import { UserRoleEntity } from '../../user-roles/entities/user-role.entity';
import { RolesEntity } from '../../roles/entities/roles.entity';
import { findEntityOrFail } from '../../../common/utils/find-or-fail.util';

const SALT_ROUNDS = 10;
const USER_ALIAS = 'user';
const STAFF_ROLE_CODES = new Set([
  'SUPER_ADMIN',
  'MUNICIPAL_ADMIN',
  'REVENUE_OFFICER',
  'CASHIER',
  'AUDITOR',
]);

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
    @InjectRepository(RolesEntity)
    private readonly rolesRepository: Repository<RolesEntity>,
  ) {}

  async create(
    dto: CreateUserDto,
    actor?: { id: string; roles: string[] },
  ): Promise<Omit<UsersEntity, 'passwordHash'>> {
    await this.checkUniqueFields({
      email: dto.email,
      username: dto.username,
      phoneNumber: dto.phoneNumber,
    });

    this.assertRoleAssignable(dto.roleCode ?? 'CITIZEN', actor);

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = this.usersRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      username: dto.username,
      email: dto.email,
      passwordHash,
      phoneNumber: dto.phoneNumber,
      status: dto.status ?? UserStatusEnum.ACTIVE,
    });

    const saved = await this.usersRepository.save(user);

    await this.assignRole(saved.id, dto.roleCode ?? 'CITIZEN');

    return this.excludePassword(saved);
  }

  private async assignRole(userId: string, roleCode: string): Promise<void> {
    const role = await this.rolesRepository.findOne({
      where: { code: roleCode },
    });
    if (!role) return;

    const exists = await this.userRoleRepository.findOne({
      where: { userId, roleId: role.id },
    });
    if (exists) return;

    await this.userRoleRepository.save(
      this.userRoleRepository.create({
        userId,
        roleId: role.id,
        assignedAt: new Date(),
      }),
    );
  }

  async findAll(
    query: QueryUserDto,
  ): Promise<PaginatedUsersResponseDto<Omit<UsersEntity, 'passwordHash'>>> {
    const qb = this.buildQuery(query);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    qb.skip((page - 1) * limit).take(limit);

    const [users, total] = await qb.getManyAndCount();

    return {
      data: users.map((user) => this.excludePassword(user)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Omit<UsersEntity, 'passwordHash'>> {
    const user = await this.findUserOrFail(id);
    return this.excludePassword(user);
  }

  async update(
    id: string,
    dto: UpdateUserDto,
  ): Promise<Omit<UsersEntity, 'passwordHash'>> {
    const user = await this.findUserOrFail(id);

    await this.checkUniqueFields(
      { email: dto.email, phoneNumber: dto.phoneNumber },
      user.id,
    );

    Object.assign(user, {
      firstName: dto.firstName ?? user.firstName,
      lastName: dto.lastName ?? user.lastName,
      email: dto.email ?? user.email,
      phoneNumber: dto.phoneNumber ?? user.phoneNumber,
      status: dto.status ?? user.status,
    });

    const saved = await this.usersRepository.save(user);
    return this.excludePassword(saved);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findUserOrFail(id);

    if (user.isSystem) {
      throw new ConflictException('System users cannot be deleted');
    }

    await this.usersRepository.softDelete(user.id);
  }

  async toggleStatus(
    id: string,
    isActive: boolean,
    actor?: { id: string; roles: string[] },
  ): Promise<Omit<UsersEntity, 'passwordHash'>> {
    if (actor && id === actor.id) {
      throw new ForbiddenException('You cannot change your own account status');
    }
    const user = await this.findUserOrFail(id);
    user.status = isActive ? UserStatusEnum.ACTIVE : UserStatusEnum.INACTIVE;
    const saved = await this.usersRepository.save(user);
    return this.excludePassword(saved);
  }

  async findByEmail(email: string): Promise<UsersEntity | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<UsersEntity | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.usersRepository.count({ where: { id } });
    return count > 0;
  }

  private async findUserOrFail(id: string): Promise<UsersEntity> {
    return findEntityOrFail(this.usersRepository, { id }, 'User', id);
  }

  private async checkUniqueFields(
    fields: { email?: string; username?: string; phoneNumber?: string },
    excludeId?: string,
  ): Promise<void> {
    if (fields.email) {
      const existingEmail = await this.usersRepository.findOne({
        where: { email: fields.email },
        withDeleted: true,
      });

      if (existingEmail && existingEmail.id !== excludeId) {
        throw new ConflictException('Email is already in use');
      }
    }

    if (fields.username) {
      const existingUsername = await this.usersRepository.findOne({
        where: { username: fields.username },
        withDeleted: true,
      });

      if (existingUsername && existingUsername.id !== excludeId) {
        throw new ConflictException('Username is already in use');
      }
    }

    if (fields.phoneNumber) {
      const existingPhoneNumber = await this.usersRepository.findOne({
        where: { phoneNumber: fields.phoneNumber },
        withDeleted: true,
      });

      if (existingPhoneNumber && existingPhoneNumber.id !== excludeId) {
        throw new ConflictException('Phone number is already in use');
      }
    }
  }

  private buildQuery(query: QueryUserDto): SelectQueryBuilder<UsersEntity> {
    const qb = this.usersRepository.createQueryBuilder(USER_ALIAS);

    if (query.search) {
      qb.andWhere(
        `(${USER_ALIAS}.firstName ILIKE :search
          OR ${USER_ALIAS}.lastName ILIKE :search
          OR ${USER_ALIAS}.username ILIKE :search
          OR ${USER_ALIAS}.email ILIKE :search)`,
        { search: `%${query.search}%` },
      );
    }

    if (query.firstName) {
      qb.andWhere(`${USER_ALIAS}.firstName ILIKE :firstName`, {
        firstName: `%${query.firstName}%`,
      });
    }

    if (query.lastName) {
      qb.andWhere(`${USER_ALIAS}.lastName ILIKE :lastName`, {
        lastName: `%${query.lastName}%`,
      });
    }

    if (query.username) {
      qb.andWhere(`${USER_ALIAS}.username ILIKE :username`, {
        username: `%${query.username}%`,
      });
    }

    if (query.email) {
      qb.andWhere(`${USER_ALIAS}.email ILIKE :email`, {
        email: `%${query.email}%`,
      });
    }

    if (query.status !== undefined) {
      qb.andWhere(`${USER_ALIAS}.status = :status`, {
        status: query.status,
      });
    }

    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'DESC';
    qb.orderBy(`${USER_ALIAS}.${sortBy}`, sortOrder);

    return qb;
  }

  private excludePassword(
    user: UsersEntity,
  ): Omit<UsersEntity, 'passwordHash'> {
    const safeUser = { ...user };
    delete (safeUser as { passwordHash?: string }).passwordHash;
    return safeUser;
  }

  /**
   * Only Super Admin / Municipal Admin may create staff accounts. Anyone
   * with user.create can create CITIZEN accounts (staff-assisted citizen
   * registration). Self-service uses POST /auth/register instead.
   */
  private assertRoleAssignable(
    roleCode: string,
    actor?: { id: string; roles: string[] },
  ): void {
    if (!STAFF_ROLE_CODES.has(roleCode)) return;
    const roles = actor?.roles ?? [];
    const allowed =
      roles.includes('Super Admin') || roles.includes('Municipal Admin');
    if (!allowed) {
      throw new ForbiddenException(
        'Only administrators can create staff accounts',
      );
    }
  }
}
