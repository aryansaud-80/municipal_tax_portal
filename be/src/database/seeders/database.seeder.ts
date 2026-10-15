import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PermissionSeeder } from './permissions/permission.seeder';
import { RoleSeeder } from './roles/role.seeder';
import { SuperAdminSeeder } from './users/super-admin.seeder';
import { RolePermissionSeeder } from './mappings/role-permission.seeder';
import { UserRoleSeeder } from './mappings/user-role.seeder';
import { BusinessDemoSeeder } from './business-demo.seeder';
import { DemoTaxRuleSeeder } from './demo-tax-rule.seeder';

@Injectable()
export class DatabaseSeeder {
  private readonly logger = new Logger(DatabaseSeeder.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly permissionSeeder: PermissionSeeder,
    private readonly roleSeeder: RoleSeeder,
    private readonly superAdminSeeder: SuperAdminSeeder,
    private readonly rolePermissionSeeder: RolePermissionSeeder,
    private readonly userRoleSeeder: UserRoleSeeder,
    private readonly businessDemoSeeder: BusinessDemoSeeder,
    private readonly demoTaxRuleSeeder: DemoTaxRuleSeeder,
  ) {}

  async run(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log('Starting database seed...');

      await this.permissionSeeder.run(queryRunner.manager);
      await this.roleSeeder.run(queryRunner.manager);
      await this.superAdminSeeder.run(queryRunner.manager);
      await this.rolePermissionSeeder.run(queryRunner.manager);
      await this.userRoleSeeder.run(queryRunner.manager);
      await this.businessDemoSeeder.run(queryRunner.manager);
      await this.demoTaxRuleSeeder.run(queryRunner.manager);

      await queryRunner.commitTransaction();
      this.logger.log('Database seed completed successfully.');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        'Database seed failed — all changes rolled back.',
        error as Error,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
