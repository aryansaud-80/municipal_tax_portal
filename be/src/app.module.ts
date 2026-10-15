import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from './common/logger';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging-interceptor';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exceptions.filter';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { join } from 'path';
import jwtConfig from './config/jwt.config';
import appConfig from './config/app.config';
import { AuthModule } from './modules/auth';
import { HealthModule } from './modules/health';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { PermissionsModule } from './modules/permissions';
import { RolePermissionsModule } from './modules/rolePermissions';
import { RolesModule } from './modules/roles';
import { UserRolesModule } from './modules/user-roles';
import { UsersModule } from './modules/users';
import { PropertiesModule } from './modules/properties';
import { TaxCategoriesModule } from './modules/tax-categories';
import { TaxAssessmentsModule } from './modules/tax-assessments';
import { PaymentsModule } from './modules/payments';
import { ReceiptsModule } from './modules/receipts';
import { NotificationsModule } from './modules/notifications';
import { DashboardModule } from './modules/dashboard';
import { AuditModule } from './modules/audit';
import { FiscalPeriodsModule } from './modules/fiscal-periods';
import { TaxRulesModule } from './modules/tax-rules';
import { PropertyApplicationsModule } from './modules/property-applications';
import { BillsModule } from './modules/bills';
import { FinesModule } from './modules/fines';
import { ReportsModule } from './modules/reports';
import { EmployeeProfilesModule } from './modules/employee-profiles';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig, appConfig],
      envFilePath: '.env',
    }),
    UsersModule,
    LoggerModule,
    RolesModule,
    PermissionsModule,
    UserRolesModule,
    RolePermissionsModule,
    AuthModule,
    HealthModule,
    PropertiesModule,
    TaxCategoriesModule,
    TaxAssessmentsModule,
    PaymentsModule,
    ReceiptsModule,
    NotificationsModule,
    DashboardModule,
    AuditModule,
    FiscalPeriodsModule,
    TaxRulesModule,
    PropertyApplicationsModule,
    BillsModule,
    FinesModule,
    ReportsModule,
    EmployeeProfilesModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        synchronize: false,
        logging: config.get<boolean>('DB_LOGGING', false),

        autoLoadEntities: true,

        migrations: [join(__dirname, 'database', 'migrations', '*.{ts,js}')],
      }),
    }),
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
