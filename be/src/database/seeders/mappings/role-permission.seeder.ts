import { Injectable, Logger } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { Seeder } from '../base/seeder.interface';
import { RolesEntity } from '../../../modules/roles/entities/roles.entity';
import { PermissionsEntity } from '../../../modules/permissions/entities/permissions.entity';
import { RolePermissionsEntity } from '../../../modules/rolePermissions/entities/rolePermissions.entity';
import { ROLE_PERMISSION_SEED_DATA } from './role-permission-seed-data';

const SUPER_ADMIN_CODE = 'SUPER_ADMIN';

@Injectable()
export class RolePermissionSeeder implements Seeder {
  private readonly logger = new Logger(RolePermissionSeeder.name);

  async run(manager: EntityManager): Promise<void> {
    const rolesRepo = manager.getRepository(RolesEntity);
    const permissionsRepo = manager.getRepository(PermissionsEntity);
    const rolePermissionsRepo = manager.getRepository(RolePermissionsEntity);

    const allPermissions = await permissionsRepo.find();
    const permissionsByCode = new Map(allPermissions.map((p) => [p.code, p]));

    let assigned = 0;
    let skipped = 0;

    const superAdminRole = await rolesRepo.findOne({
      where: { code: SUPER_ADMIN_CODE },
    });

    if (!superAdminRole) {
      throw new Error(
        `${SUPER_ADMIN_CODE} role not found — ensure RoleSeeder ran first.`,
      );
    }

    for (const permission of allPermissions) {
      const wasNew = await this.assignIfMissing(
        rolePermissionsRepo,
        superAdminRole.id,
        permission.id,
      );
      wasNew ? assigned++ : skipped++;
    }

    for (const [roleCode, permissionCodes] of Object.entries(
      ROLE_PERMISSION_SEED_DATA,
    )) {
      const role = await rolesRepo.findOne({ where: { code: roleCode } });

      if (!role) {
        this.logger.warn(
          `Role '${roleCode}' not found — skipping its permission mappings.`,
        );
        continue;
      }

      for (const code of permissionCodes) {
        const permission = permissionsByCode.get(code);

        if (!permission) {
          this.logger.warn(
            `Permission '${code}' not found for role '${roleCode}' — skipping.`,
          );
          continue;
        }

        const wasNew = await this.assignIfMissing(
          rolePermissionsRepo,
          role.id,
          permission.id,
        );
        wasNew ? assigned++ : skipped++;
      }
    }

    this.logger.log(
      `Role-permissions: ${assigned} newly assigned, ${skipped} already existed.`,
    );
  }

  private async assignIfMissing(
    repository: Repository<RolePermissionsEntity>,
    roleId: string,
    permissionId: string,
  ): Promise<boolean> {
    const existing = await repository.findOne({
      where: { roleId, permissionId },
    });

    if (existing) {
      return false;
    }

    await repository.save(repository.create({ roleId, permissionId }));
    return true;
  }
}
