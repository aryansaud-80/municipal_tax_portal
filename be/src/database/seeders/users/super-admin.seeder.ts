import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Seeder } from '../base/seeder.interface';
import { UsersEntity } from '../../../modules/users/entities/users.entity';
import { UserStatusEnum } from '../../../modules/users/enums/user-status.enum';

@Injectable()
export class SuperAdminSeeder implements Seeder {
  private readonly logger = new Logger(SuperAdminSeeder.name);

  constructor(private readonly configService: ConfigService) {}

  async run(manager: EntityManager): Promise<void> {
    const repository = manager.getRepository(UsersEntity);

    const name = this.requireEnv('SUPER_ADMIN_NAME');
    const email = this.requireEnv('SUPER_ADMIN_EMAIL');
    const username = this.requireEnv('SUPER_ADMIN_USERNAME');
    const phoneNumber = this.requireEnv('SUPER_ADMIN_PHONE_NUMBER');
    const password = this.requireEnv('SUPER_ADMIN_PASSWORD');

    const [firstName, ...rest] = name.trim().split(/\s+/);
    const lastName = rest.join(' ') || firstName;

    const existing = await repository.findOne({
      where: { email },
      withDeleted: true,
    });

    if (existing) {
      let needsSave = false;

      if (existing.deletedAt) {
        existing.deletedAt = undefined;
        needsSave = true;
      }

      if (existing.firstName !== firstName || existing.lastName !== lastName) {
        existing.firstName = firstName;
        existing.lastName = lastName;
        needsSave = true;
      }

      // Password is intentionally never touched on rerun.
      if (needsSave) {
        await repository.save(existing);
        this.logger.log('Super Admin profile updated (password unchanged).');
      } else {
        this.logger.log('Super Admin already exists — no changes needed.');
      }

      return;
    }

    const saltRounds = this.configService.get<number>('app.bcryptSaltRounds', 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await repository.save(
      repository.create({
        firstName,
        lastName,
        username,
        email,
        phoneNumber,
        passwordHash,
        status: UserStatusEnum.ACTIVE,
        emailVerified: true,
        phoneVerified: true,
        isSystem: true,
      }),
    );

    this.logger.log(`Super Admin created: ${email}`);
  }

  private requireEnv(key: string): string {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new Error(`Missing required env var: ${key}. Cannot seed Super Admin.`);
    }

    return value;
  }
}