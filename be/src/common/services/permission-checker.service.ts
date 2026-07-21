import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RolePermissionsEntity } from '../../modules/rolePermissions/entities/rolePermissions.entity';
import { UserRoleEntity } from '../../modules/user-roles/entities/user-role.entity';
import { PermissionMatchType } from '../types/permission-match-type.type';

export interface PermissionCheckResult {
  allowed: boolean;
  missing: string[];
}

@Injectable()
export class PermissionsCheckerService {
  constructor(
    @InjectRepository(UserRoleEntity)
    private readonly userRolesRepository: Repository<UserRoleEntity>,
    @InjectRepository(RolePermissionsEntity)
    private readonly rolePermissionsRepository: Repository<RolePermissionsEntity>,
  ) {}

  async getUserPermissionCodes(userId: string): Promise<string[]> {
    const roleIds = await this.getUserRoleIds(userId);

    if (!roleIds.length) {
      return [];
    }

    const rolePermissions = await this.rolePermissionsRepository.find({
      where: { roleId: In(roleIds) },
      relations: { permission: true },
    });

    return [...new Set(rolePermissions.map((rp) => rp.permission.code))];
  }

  async getUserRoleNames(userId: string): Promise<string[]> {
    const userRoles = await this.userRolesRepository.find({
      where: { userId },
      relations: { role: true },
    });

    return userRoles.map((ur) => ur.role.name);
  }

  async checkPermissions(
    userId: string,
    required: string[],
    matchType: PermissionMatchType,
  ): Promise<PermissionCheckResult> {
    const granted = await this.getUserPermissionCodes(userId);
    const grantedSet = new Set(granted);

    const missing = required.filter((code) => !grantedSet.has(code));

    const allowed =
      matchType === 'ALL'
        ? missing.length === 0
        : missing.length < required.length;

    return { allowed, missing };
  }

  private async getUserRoleIds(userId: string): Promise<string[]> {
    const userRoles = await this.userRolesRepository.find({
      where: { userId },
    });

    return userRoles.map((ur) => ur.roleId);
  }
}
