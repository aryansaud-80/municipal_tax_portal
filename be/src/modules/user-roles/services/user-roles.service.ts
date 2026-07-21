import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserRoleEntity } from '../entities/user-role.entity';
import { UsersEntity } from '../../users/entities/users.entity';
import { RolesEntity } from '../../roles/entities/roles.entity';
import { AssignUserRoleDto } from '../dto/assign-user-role.dto';
import { AssignMultipleRolesDto } from '../dto/assign-multiple-roles.dto';
import { RemoveUserRoleDto } from '../dto/remove-user-role.dto';
import {
  findEntityOrFail,
  findEntitiesOrFail,
} from '../../../common/utils/find-or-fail.util';
import { filterUnassignedIds } from '../../../common/utils/join-diff.util';

const UNIQUE_VIOLATION_CODE = '23505';

@Injectable()
export class UserRolesService {
  constructor(
    @InjectRepository(UserRoleEntity)
    private readonly userRolesRepository: Repository<UserRoleEntity>,
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(RolesEntity)
    private readonly rolesRepository: Repository<RolesEntity>,
  ) {}

  async assignRole(dto: AssignUserRoleDto): Promise<UserRoleEntity> {
    return this.userRolesRepository.manager.transaction(async (em) => {
      const usersRepo = em.getRepository(UsersEntity);
      const rolesRepo = em.getRepository(RolesEntity);
      const userRolesRepo = em.getRepository(UserRoleEntity);

      await findEntityOrFail(usersRepo, { id: dto.userId }, 'User', dto.userId);
      await findEntityOrFail(rolesRepo, { id: dto.roleId }, 'Role', dto.roleId);

      const existing = await userRolesRepo.findOne({
        where: { userId: dto.userId, roleId: dto.roleId },
      });

      if (existing) {
        throw new ConflictException(
          'This role is already assigned to the user',
        );
      }

      const userRole = userRolesRepo.create({
        userId: dto.userId,
        roleId: dto.roleId,
        assignedBy: dto.assignedBy,
      });

      try {
        return await userRolesRepo.save(userRole);
      } catch (error: any) {
        if (error?.code === UNIQUE_VIOLATION_CODE) {
          throw new ConflictException(
            'This role is already assigned to the user',
          );
        }
        throw error;
      }
    });
  }

  async assignMultipleRoles(
    dto: AssignMultipleRolesDto,
  ): Promise<UserRoleEntity[]> {
    return this.userRolesRepository.manager.transaction(async (em) => {
      const usersRepo = em.getRepository(UsersEntity);
      const rolesRepo = em.getRepository(RolesEntity);
      const userRolesRepo = em.getRepository(UserRoleEntity);

      await findEntityOrFail(usersRepo, { id: dto.userId }, 'User', dto.userId);
      await findEntitiesOrFail(
        rolesRepo,
        { id: In(dto.roleIds) },
        dto.roleIds.length,
        'Role',
      );

      const existingRows = await userRolesRepo.find({
        where: { userId: dto.userId },
      });
      const existingIds = new Set(existingRows.map((ur) => ur.roleId));
      const newRoleIds = filterUnassignedIds(dto.roleIds, existingIds);

      if (!newRoleIds.length) {
        throw new ConflictException(
          'All provided roles are already assigned to this user',
        );
      }

      const userRoles = newRoleIds.map((roleId) =>
        userRolesRepo.create({
          userId: dto.userId,
          roleId,
          assignedBy: dto.assignedBy,
        }),
      );

      try {
        return await userRolesRepo.save(userRoles);
      } catch (error: any) {
        if (error?.code === UNIQUE_VIOLATION_CODE) {
          throw new ConflictException(
            'One or more roles are already assigned to this user',
          );
        }
        throw error;
      }
    });
  }

  async syncRoles(dto: AssignMultipleRolesDto): Promise<UserRoleEntity[]> {
    return this.userRolesRepository.manager.transaction(async (em) => {
      const usersRepo = em.getRepository(UsersEntity);
      const rolesRepo = em.getRepository(RolesEntity);
      const userRolesRepo = em.getRepository(UserRoleEntity);

      await findEntityOrFail(usersRepo, { id: dto.userId }, 'User', dto.userId);

      if (dto.roleIds.length) {
        await findEntitiesOrFail(
          rolesRepo,
          { id: In(dto.roleIds) },
          dto.roleIds.length,
          'Role',
        );
      }

      await userRolesRepo.delete({ userId: dto.userId });

      if (!dto.roleIds.length) {
        return [];
      }

      const userRoles = dto.roleIds.map((roleId) =>
        userRolesRepo.create({
          userId: dto.userId,
          roleId,
          assignedBy: dto.assignedBy,
        }),
      );

      return userRolesRepo.save(userRoles);
    });
  }

  async removeRole(dto: RemoveUserRoleDto): Promise<void> {
    const userRole = await this.userRolesRepository.findOne({
      where: { userId: dto.userId, roleId: dto.roleId },
    });

    if (!userRole) {
      throw new NotFoundException(
        `Role ${dto.roleId} is not assigned to user ${dto.userId}`,
      );
    }

    await this.userRolesRepository.remove(userRole);
  }

  async findRolesByUser(userId: string): Promise<RolesEntity[]> {
    await findEntityOrFail(
      this.usersRepository,
      { id: userId },
      'User',
      userId,
    );

    const userRoles = await this.userRolesRepository.find({
      where: { userId },
      relations: { role: true },
    });

    return userRoles.map((ur) => ur.role);
  }

  async findUsersByRole(roleId: string): Promise<UsersEntity[]> {
    await findEntityOrFail(
      this.rolesRepository,
      { id: roleId },
      'Role',
      roleId,
    );

    const userRoles = await this.userRolesRepository.find({
      where: { roleId },
      relations: { user: true },
    });

    return userRoles.map((ur) => ur.user);
  }

  async userHasRole(userId: string, roleId: string): Promise<boolean> {
    const count = await this.userRolesRepository.count({
      where: { userId, roleId },
    });

    return count > 0;
  }
}
