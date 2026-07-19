import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from './common/logger';
import { join } from 'path';
import { AuthModule } from './modules/auth';
import { HealthModule } from './modules/health';
import { PermissionsModule } from './modules/permissions';
import { RolePermissionsModule } from './modules/rolePermissions';
import { RolesModule } from './modules/roles';
import { UserRolesModule } from './modules/user-roles';
import { UsersModule } from './modules/users';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
})
export class AppModule {}
