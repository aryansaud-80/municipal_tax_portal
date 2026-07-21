import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PermissionsCheckerService } from '../../common/services/permission-checker.service';
import { RolePermissionsEntity } from '../rolePermissions/entities/rolePermissions.entity';
import { UserRoleEntity } from '../user-roles/entities/user-role.entity';
import { UsersEntity } from '../users/entities/users.entity';
import { RefreshTokenEntity } from './entities/refreshToken.entity';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:
          config.get<string>('jwt.accessSecret') ?? 'default_access_secret',
        signOptions: {
          expiresIn: (config.get<string>('jwt.accessExpiresIn') ??
            '15m') as any,
        },
      }),
    }),
    TypeOrmModule.forFeature([
      RefreshTokenEntity,
      UsersEntity,
      UserRoleEntity,
      RolePermissionsEntity,
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    RefreshTokenGuard,
    PermissionsCheckerService,
  ],
  exports: [
    AuthService,
    PermissionsCheckerService,
    TypeOrmModule,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
