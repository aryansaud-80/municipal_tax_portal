import { Injectable, Logger } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Seeder } from './base/seeder.interface';
import { UsersEntity } from '../../modules/users/entities/users.entity';
import { UserStatusEnum } from '../../modules/users/enums/user-status.enum';
import { RolesEntity } from '../../modules/roles/entities/roles.entity';
import { UserRoleEntity } from '../../modules/user-roles/entities/user-role.entity';
import { RolePermissionsEntity } from '../../modules/rolePermissions/entities/rolePermissions.entity';
import { PermissionsEntity } from '../../modules/permissions/entities/permissions.entity';
import { PropertyEntity } from '../../modules/properties/entities/property.entity';
import { TaxCategoryEntity } from '../../modules/tax-categories/entities/tax-category.entity';
import { TaxAssessmentEntity } from '../../modules/tax-assessments/entities/tax-assessment.entity';
import { PaymentEntity } from '../../modules/payments/entities/payment.entity';
import { ReceiptEntity } from '../../modules/receipts/entities/receipt.entity';
import { PropertyTypeEnum } from '../../common/enums/property-type.enum';
import { PropertyStatusEnum } from '../../common/enums/property-status.enum';
import { TaxCategoryCodeEnum } from '../../common/enums/tax-category-code.enum';
import { RateTypeEnum } from '../../common/enums/rate-type.enum';
import { TaxAssessmentStatusEnum } from '../../common/enums/tax-assessment-status.enum';
import { PaymentMethodEnum } from '../../common/enums/payment-method.enum';
import { PaymentStatusEnum } from '../../common/enums/payment-status.enum';

@Injectable()
export class BusinessDemoSeeder implements Seeder {
  private readonly logger = new Logger(BusinessDemoSeeder.name);

  async run(manager: EntityManager): Promise<void> {
    await this.seedCitizenRole(manager);
    await this.seedTaxCategories(manager);
    await this.seedDemoCitizens(manager);
    await this.backfillReceipts(manager);
  }

  private async seedCitizenRole(manager: EntityManager): Promise<void> {
    const roleRepo = manager.getRepository(RolesEntity);
    const permRepo = manager.getRepository(PermissionsEntity);
    const rpRepo = manager.getRepository(RolePermissionsEntity);

    let citizenRole = await roleRepo.findOne({ where: { code: 'CITIZEN' } });
    if (!citizenRole) {
      citizenRole = await roleRepo.save(
        roleRepo.create({
          name: 'Citizen',
          code: 'CITIZEN',
          description: 'Regular citizen with portal access',
          isSystem: true,
          isActive: true,
        }),
      );
    }

    const citizenPermCodes = [
      'propertyTax.view',
      'propertyTax.create',
      'houseRentTax.view',
      'businessTax.view',
      'landTax.view',
      'advertisementTax.view',
      'bill.view',
      'payment.create',
      'payment.view',
      'receipt.view',
      'dashboard.view',
      'citizen.view',
    ];
    const perms = await permRepo.find({
      where: citizenPermCodes.map((code) => ({ code })),
    });
    for (const perm of perms) {
      const exists = await rpRepo.findOne({
        where: { roleId: citizenRole.id, permissionId: perm.id },
      });
      if (!exists) {
        await rpRepo.save(
          rpRepo.create({ roleId: citizenRole.id, permissionId: perm.id }),
        );
      }
    }
  }

  private async seedTaxCategories(manager: EntityManager): Promise<void> {
    const repo = manager.getRepository(TaxCategoryEntity);

    const categories = [
      {
        name: 'Property Tax',
        code: TaxCategoryCodeEnum.PROPERTY_TAX,
        rateType: RateTypeEnum.PERCENTAGE,
        rate: 0.5,
        description: 'Annual tax on property value',
      },
      {
        name: 'House Rent Tax',
        code: TaxCategoryCodeEnum.HOUSE_RENT_TAX,
        rateType: RateTypeEnum.PERCENTAGE,
        rate: 10,
        description: 'Tax on rental income from house',
      },
      {
        name: 'Business Tax',
        code: TaxCategoryCodeEnum.BUSINESS_TAX,
        rateType: RateTypeEnum.FIXED,
        rate: 5000,
        description: 'Annual business operating tax',
      },
      {
        name: 'Land Tax',
        code: TaxCategoryCodeEnum.LAND_TAX,
        rateType: RateTypeEnum.PERCENTAGE,
        rate: 0.3,
        description: 'Annual tax on land value',
      },
      {
        name: 'Advertisement Tax',
        code: TaxCategoryCodeEnum.ADVERTISEMENT_TAX,
        rateType: RateTypeEnum.FIXED,
        rate: 1000,
        description: 'Annual tax on advertising boards',
      },
    ];

    for (const cat of categories) {
      const existing = await repo.findOne({ where: { code: cat.code } });
      if (!existing) {
        await repo.save(repo.create({ ...cat, minAmount: 0, isActive: true }));
      }
    }
    this.logger.log('Tax categories seeded (5 categories).');
  }

  private async seedDemoCitizens(manager: EntityManager): Promise<void> {
    const userRepo = manager.getRepository(UsersEntity);
    const roleRepo = manager.getRepository(RolesEntity);
    const userRoleRepo = manager.getRepository(UserRoleEntity);
    const propertyRepo = manager.getRepository(PropertyEntity);
    const assessmentRepo = manager.getRepository(TaxAssessmentEntity);
    const categoryRepo = manager.getRepository(TaxCategoryEntity);
    const paymentRepo = manager.getRepository(PaymentEntity);

    const citizenRole = await roleRepo.findOne({ where: { code: 'CITIZEN' } });
    if (!citizenRole) {
      throw new Error('CITIZEN role must exist before seeding demo citizens');
    }

    const saltRounds = 10;

    const demoUsers = [
      {
        firstName: 'Ram',
        lastName: 'Sharma',
        email: 'ram@example.com',
        username: 'ramsharma',
        phoneNumber: '+9779800000001',
        password: 'Citizen123!',
        ward: 1,
      },
      {
        firstName: 'Sita',
        lastName: 'Karki',
        email: 'sita@example.com',
        username: 'sitakarki',
        phoneNumber: '+9779800000002',
        password: 'Citizen123!',
        ward: 2,
      },
      {
        firstName: 'Hari',
        lastName: 'Gurung',
        email: 'hari@example.com',
        username: 'harigurung',
        phoneNumber: '+9779800000003',
        password: 'Citizen123!',
        ward: 3,
      },
    ];

    const categories = await categoryRepo.find();

    for (let i = 0; i < demoUsers.length; i++) {
      const d = demoUsers[i];
      let user = await userRepo.findOne({ where: { email: d.email } });

      if (!user) {
        const passwordHash = await bcrypt.hash(d.password, saltRounds);
        user = await userRepo.save(
          userRepo.create({
            firstName: d.firstName,
            lastName: d.lastName,
            username: d.username,
            email: d.email,
            phoneNumber: d.phoneNumber,
            passwordHash,
            status: UserStatusEnum.ACTIVE,
            emailVerified: true,
            phoneVerified: true,
          }),
        );
      }

      const roleExists = await userRoleRepo.findOne({
        where: { userId: user.id, roleId: citizenRole.id },
      });
      if (!roleExists) {
        await userRoleRepo.save(
          userRoleRepo.create({
            userId: user.id,
            roleId: citizenRole.id,
            assignedAt: new Date(),
          }),
        );
      }

      const property = await this.seedProperty(
        manager,
        propertyRepo,
        user,
        d.ward,
        i,
      );
      await this.seedAssessments(
        manager,
        assessmentRepo,
        categoryRepo,
        paymentRepo,
        user,
        property,
        categories,
        i,
      );
    }

    this.logger.log(
      'Demo citizens, properties, assessments and payments seeded.',
    );
  }

  private async seedProperty(
    manager: EntityManager,
    repo: Repository<PropertyEntity>,
    user: UsersEntity,
    ward: number,
    index: number,
  ): Promise<PropertyEntity> {
    const existing = await repo.findOne({ where: { userId: user.id } });
    if (existing) return existing;

    return repo.save(
      repo.create({
        propertyNumber: `PROP-${String(index + 1).padStart(6, '0')}`,
        userId: user.id,
        ownerName: `${user.firstName} ${user.lastName}`,
        address: `Ward ${ward}, Kathmandu`,
        ward,
        tole: 'Main Road',
        areaSqMeters: 150 + index * 25,
        propertyType: PropertyTypeEnum.RESIDENTIAL,
        status: PropertyStatusEnum.ACTIVE,
        landOwnershipNumber: `LAL-${1000 + index}`,
        floorCount: 2,
        buildingAgeYears: 10 + index,
      }),
    );
  }

  private async seedAssessments(
    manager: EntityManager,
    assessmentRepo: Repository<TaxAssessmentEntity>,
    categoryRepo: Repository<TaxCategoryEntity>,
    paymentRepo: Repository<PaymentEntity>,
    user: UsersEntity,
    property: PropertyEntity,
    categories: TaxCategoryEntity[],
    index: number,
  ): Promise<void> {
    const fiscalYear = '2082/83';
    const existing = await assessmentRepo.findOne({
      where: { userId: user.id },
    });
    if (existing) return;

    let count = 0;
    for (const category of categories) {
      count++;
      let assessedValue = 0;
      let taxAmount = 0;

      switch (category.code) {
        case TaxCategoryCodeEnum.PROPERTY_TAX:
          assessedValue = property.areaSqMeters * 200000;
          taxAmount = (assessedValue * Number(category.rate)) / 100;
          break;
        case TaxCategoryCodeEnum.HOUSE_RENT_TAX:
          assessedValue = 500000 + index * 100000;
          taxAmount = (assessedValue * Number(category.rate)) / 100;
          break;
        case TaxCategoryCodeEnum.BUSINESS_TAX:
          assessedValue = 100000;
          taxAmount = Number(category.rate);
          break;
        case TaxCategoryCodeEnum.LAND_TAX:
          assessedValue = property.areaSqMeters * 150000;
          taxAmount = (assessedValue * Number(category.rate)) / 100;
          break;
        case TaxCategoryCodeEnum.ADVERTISEMENT_TAX:
          assessedValue = 50000;
          taxAmount = Number(category.rate);
          break;
      }

      const paid = index === 0 && count <= 2;
      const status = paid
        ? TaxAssessmentStatusEnum.PAID
        : index === 1 && count === 3
          ? TaxAssessmentStatusEnum.PARTIALLY_PAID
          : TaxAssessmentStatusEnum.PENDING;
      const amountPaid = paid
        ? taxAmount
        : status === TaxAssessmentStatusEnum.PARTIALLY_PAID
          ? taxAmount * 0.5
          : 0;

      const assessment = await assessmentRepo.save(
        assessmentRepo.create({
          assessmentNumber: `TAX-${String(index).padStart(3, '0')}${String(count).padStart(3, '0')}`,
          userId: user.id,
          propertyId: property.id,
          taxCategoryId: category.id,
          fiscalYear,
          assessedValue,
          taxAmount,
          discount: 0,
          penalty: 0,
          totalDue: taxAmount,
          amountPaid,
          status,
          dueDate: '2026-12-31',
          notes: `${category.name} for FY ${fiscalYear}`,
        }),
      );

      if (paid) {
        await paymentRepo.save(
          paymentRepo.create({
            paymentNumber: `PAY-${String(index).padStart(3, '0')}${String(count).padStart(3, '0')}`,
            userId: user.id,
            taxAssessmentId: assessment.id,
            amount: taxAmount,
            method: PaymentMethodEnum.KHALTI,
            status: PaymentStatusEnum.VERIFIED,
            paidAt: new Date(),
            verifiedAt: new Date(),
          }),
        );
      }
    }
  }

  private async backfillReceipts(manager: EntityManager): Promise<void> {
    const paymentRepo = manager.getRepository(PaymentEntity);
    const receiptRepo = manager.getRepository(ReceiptEntity);

    const verifiedPayments = await paymentRepo.find({
      where: { status: PaymentStatusEnum.VERIFIED },
    });

    let created = 0;
    for (const payment of verifiedPayments) {
      const existing = await receiptRepo.findOne({
        where: { paymentId: payment.id },
      });
      if (existing) continue;

      const receiptCount = await receiptRepo.count();
      await receiptRepo.save(
        receiptRepo.create({
          receiptNumber: `RCP-${String(receiptCount + 1).padStart(6, '0')}`,
          paymentId: payment.id,
          userId: payment.userId,
          taxAssessmentId: payment.taxAssessmentId,
          amount: payment.amount,
        }),
      );
      created++;
    }

    this.logger.log(`Receipts backfilled (${created} created).`);
  }
}
