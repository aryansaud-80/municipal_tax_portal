import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Seeder } from '../base/seeder.interface';
import { UsersEntity } from '../../../modules/users/entities/users.entity';
import { RolesEntity } from '../../../modules/roles/entities/roles.entity';
import { UserRoleEntity } from '../../../modules/user-roles/entities/user-role.entity';

const SUPER_ADMIN_CODE = 'SUPER_ADMIN';

@Injectable()
export class UserRoleSeeder implements Seeder {
  private readonly logger = new Logger(UserRoleSeeder.name);

  constructor(private readonly configService: ConfigService) {}

  async run(manager: EntityManager): Promise<void> {
    const usersRepo = manager.getRepository(UsersEntity);
    const rolesRepo = manager.getRepository(RolesEntity);
    const userRolesRepo = manager.getRepository(UserRoleEntity);

    const email = this.configService.get<string>('SUPER_ADMIN_EMAIL');

    if (!email) {
      throw new Error(
        'SUPER_ADMIN_EMAIL is not set — cannot map Super Admin role.',
      );
    }

    const user = await usersRepo.findOne({ where: { email } });
    const role = await rolesRepo.findOne({ where: { code: SUPER_ADMIN_CODE } });

    if (!user || !role) {
      throw new Error(
        'Super Admin user or SUPER_ADMIN role missing — check prior seeders.',
      );
    }

    const existing = await userRolesRepo.findOne({
      where: { userId: user.id, roleId: role.id },
    });

    if (existing) {
      this.logger.log('Super Admin already has SUPER_ADMIN role.');
      return;
    }

    await userRolesRepo.save(
      userRolesRepo.create({ userId: user.id, roleId: role.id }),
    );
    this.logger.log('SUPER_ADMIN role assigned to Super Admin user.');
  }
}
