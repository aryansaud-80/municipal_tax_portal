import {
  ConflictException,
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
import { findEntityOrFail } from '../../../common/utils/find-or-fail.util';

const SALT_ROUNDS = 10;
const USER_ALIAS = 'user';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
  ) {}

  async create(dto: CreateUserDto): Promise<Omit<UsersEntity, 'passwordHash'>> {
    await this.checkUniqueFields({
      email: dto.email,
      username: dto.username,
      phoneNumber: dto.phoneNumber,
    });

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = this.usersRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      username: dto.username,
      email: dto.email,
      passwordHash,
      phoneNumber: dto.phoneNumber,
      status: dto.status,
    });

    const saved = await this.usersRepository.save(user);
    return this.excludePassword(saved);
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
  ): Promise<Omit<UsersEntity, 'passwordHash'>> {
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
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
