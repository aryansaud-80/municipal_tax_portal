import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RolePermissionsEntity } from '../entities/rolePermissions.entity';
import { RolesEntity } from '../../roles/entities/roles.entity';
import { PermissionsEntity } from '../../permissions/entities/permissions.entity';
import { AssignRolePermissionsDto } from '../dto/assign-role-permission.dto';
import {
  findEntityOrFail,
  findEntitiesOrFail,
} from '../../../common/utils/find-or-fail.util';

const UNIQUE_VIOLATION_CODE = '23505';

@Injectable()
export class RolePermissionsService {
  constructor(
    @InjectRepository(RolePermissionsEntity)
    private readonly rolePermissionsRepository: Repository<RolePermissionsEntity>,
    @InjectRepository(RolesEntity)
    private readonly rolesRepository: Repository<RolesEntity>,
    @InjectRepository(PermissionsEntity)
    private readonly permissionsRepository: Repository<PermissionsEntity>,
  ) {}

  async assignPermissions(
    dto: AssignRolePermissionsDto,
  ): Promise<RolePermissionsEntity[]> {
    const { roleId, permissionIds } = dto;

    if (!permissionIds?.length) {
      throw new BadRequestException('permissionIds must not be empty');
    }

    return this.rolePermissionsRepository.manager.transaction(async (em) => {
      const rolesRepo = em.getRepository(RolesEntity);
      const permissionsRepo = em.getRepository(PermissionsEntity);
      const rolePermissionsRepo = em.getRepository(RolePermissionsEntity);

      const role = await findEntityOrFail(
        rolesRepo,
        { id: roleId },
        'Role',
        roleId,
      );
      const permissions = await findEntitiesOrFail(
        permissionsRepo,
        { id: In(permissionIds) },
        permissionIds.length,
        'Permission',
      );

      const existingRows = await rolePermissionsRepo.find({
        where: { role: { id: roleId } },
        relations: { permission: true },
      });
      const existingIds = new Set(existingRows.map((rp) => rp.permission.id));
      const newPermissions = permissions.filter(
        (permission) => !existingIds.has(permission.id),
      );

      if (!newPermissions.length) {
        throw new ConflictException(
          'All provided permissions are already assigned to this role',
        );
      }

      const rolePermissions = newPermissions.map((permission) =>
        rolePermissionsRepo.create({ role, permission }),
      );

      try {
        return await rolePermissionsRepo.save(rolePermissions);
      } catch (error: any) {
        if (error?.code === UNIQUE_VIOLATION_CODE) {
          throw new ConflictException(
            'One or more permissions are already assigned to this role',
          );
        }
        throw error;
      }
    });
  }

  async syncPermissions(
    dto: AssignRolePermissionsDto,
  ): Promise<RolePermissionsEntity[]> {
    const { roleId, permissionIds } = dto;

    return this.rolePermissionsRepository.manager.transaction(async (em) => {
      const rolesRepo = em.getRepository(RolesEntity);
      const permissionsRepo = em.getRepository(PermissionsEntity);
      const rolePermissionsRepo = em.getRepository(RolePermissionsEntity);

      const role = await findEntityOrFail(
        rolesRepo,
        { id: roleId },
        'Role',
        roleId,
      );
      const permissions = permissionIds.length
        ? await findEntitiesOrFail(
            permissionsRepo,
            { id: In(permissionIds) },
            permissionIds.length,
            'Permission',
          )
        : [];

      await rolePermissionsRepo.delete({ role: { id: roleId } });

      if (!permissions.length) {
        return [];
      }

      const rolePermissions = permissions.map((permission) =>
        rolePermissionsRepo.create({ role, permission }),
      );

      return rolePermissionsRepo.save(rolePermissions);
    });
  }

  async removePermission(
    dto: AssignRolePermissionsDto,
  ): Promise<RolePermissionsEntity[]> {
    const { roleId, permissionIds } = dto;

    if (!permissionIds?.length) {
      throw new BadRequestException('permissionIds must not be empty');
    }

    await findEntityOrFail(
      this.rolesRepository,
      { id: roleId },
      'Role',
      roleId,
    );

    const rolePermissions = await this.rolePermissionsRepository.find({
      where: {
        role: { id: roleId },
        permission: { id: In(permissionIds) },
      },
      relations: { role: true, permission: true },
    });

    if (!rolePermissions.length) {
      throw new NotFoundException(
        'None of the given permissions are assigned to this role',
      );
    }

    await this.rolePermissionsRepository.remove(rolePermissions);
    return rolePermissions;
  }

  async findPermissionsByRole(roleId: string): Promise<PermissionsEntity[]> {
    await findEntityOrFail(
      this.rolesRepository,
      { id: roleId },
      'Role',
      roleId,
    );

    const rolePermissions = await this.rolePermissionsRepository.find({
      where: { role: { id: roleId } },
      relations: { permission: true },
    });

    return rolePermissions.map((rp) => rp.permission);
  }

  async findRolesByPermission(permissionId: string): Promise<RolesEntity[]> {
    await findEntityOrFail(
      this.permissionsRepository,
      { id: permissionId },
      'Permission',
      permissionId,
    );

    const rolePermissions = await this.rolePermissionsRepository.find({
      where: { permission: { id: permissionId } },
      relations: { role: true },
    });

    return rolePermissions.map((rp) => rp.role);
  }

  async roleHasPermission(
    roleId: string,
    permissionId: string,
  ): Promise<boolean> {
    const count = await this.rolePermissionsRepository.count({
      where: {
        role: { id: roleId },
        permission: { id: permissionId },
      },
    });

    return count > 0;
  }
}
