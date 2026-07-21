import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { PermissionsCheckerService } from '../../../common/services/permission-checker.service';
import { UsersEntity } from '../../users/entities/users.entity';
import { UserStatusEnum } from '../../users/enums/user-status.enum';
import { RefreshTokenEntity } from '../entities/refreshToken.entity';
import { LoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';

interface RequestMeta {
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokensRepository: Repository<RefreshTokenEntity>,
    private readonly permissionsChecker: PermissionsCheckerService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatusEnum.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.toAuthenticatedUser(user);
  }

  async login(dto: LoginDto, meta?: RequestMeta) {
    const user = await this.validateUser(dto.email, dto.password);
    const [roles, permissions] = await Promise.all([
      this.permissionsChecker.getUserRoleNames(user.id),
      this.permissionsChecker.getUserPermissionCodes(user.id),
    ]);

    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id, meta);

    await this.touchLastLogin(user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn'),
      user,
      roles,
      permissions,
    };
  }

  async refresh(payload: JwtPayload, rawToken: string) {
    if (!payload.jti) {
      throw new UnauthorizedException('Malformed refresh token');
    }

    const tokenRow = await this.refreshTokensRepository.findOne({
      where: { id: payload.jti },
    });

    if (!tokenRow || tokenRow.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is no longer valid');
    }

    const hashMatches = await this.compareRefreshToken(
      rawToken,
      tokenRow.tokenHash,
    );

    if (!hashMatches) {
      throw new UnauthorizedException('Refresh token is no longer valid');
    }

    const user = await this.usersRepository.findOne({
      where: { id: tokenRow.userId },
    });

    if (!user || user.status !== UserStatusEnum.ACTIVE) {
      throw new ForbiddenException('Account is not active');
    }

    const meta: RequestMeta = {
      deviceName: tokenRow.deviceName,
      ipAddress: tokenRow.ipAddress,
      userAgent: tokenRow.userAgent,
    };

    const authenticatedUser = this.toAuthenticatedUser(user);
    const accessToken = await this.generateAccessToken(authenticatedUser);

    const newRefreshToken =
      await this.refreshTokensRepository.manager.transaction(async (em) => {
        await em.delete(RefreshTokenEntity, { id: tokenRow.id });
        return this.generateRefreshToken(user.id, meta, em);
      });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn'),
    };
  }

  async logout(payload: JwtPayload): Promise<void> {
    if (!payload.jti) {
      return;
    }

    await this.refreshTokensRepository.delete({ id: payload.jti });
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    const currentMatches = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!currentMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.passwordHash = await this.hashValue(dto.newPassword);
    await this.usersRepository.save(user);
    await this.revokeAllUserTokens(userId);
  }

  private toAuthenticatedUser(user: UsersEntity): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  private async generateAccessToken(user: AuthenticatedUser): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      type: 'access',
    };

    return this.jwtService.signAsync(payload);
  }

  private async generateRefreshToken(
    userId: string,
    meta?: RequestMeta,
    entityManager?: EntityManager,
  ): Promise<string> {
    const refreshExpiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d';
    const jti = crypto.randomUUID();
    const expiresAt = this.computeExpiryDate(refreshExpiresIn);

    const payload: JwtPayload = {
      sub: userId,
      email: '',
      type: 'refresh',
      jti,
    };

    const rawToken = await this.jwtService.signAsync(payload, {
      secret:
        this.configService.get<string>('jwt.refreshSecret') ??
        'default_refresh_secret',
      expiresIn: refreshExpiresIn as JwtSignOptions['expiresIn'],
    });

    const tokenHash = await this.hashValue(rawToken);

    const repo = entityManager
      ? entityManager.getRepository(RefreshTokenEntity)
      : this.refreshTokensRepository;

    const tokenRow = repo.create({
      id: jti,
      userId,
      tokenHash,
      expiresAt,
      deviceName: meta?.deviceName,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    await repo.save(tokenRow);
    return rawToken;
  }

  private async hashValue(value: string): Promise<string> {
    const saltRounds =
      this.configService.get<number>('app.bcryptSaltRounds') ?? 10;
    return bcrypt.hash(value, saltRounds);
  }

  private async compareRefreshToken(
    rawToken: string,
    tokenHash: string,
  ): Promise<boolean> {
    return bcrypt.compare(rawToken, tokenHash);
  }

  private async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokensRepository.delete({ userId });
  }

  private async touchLastLogin(userId: string): Promise<void> {
    await this.usersRepository.update(userId, { lastLoginAt: new Date() });
  }

  private computeExpiryDate(expiry: string): Date {
    const match = /^(\d+)([smhd])$/.exec(expiry);
    const now = Date.now();

    if (!match) {
      return new Date(now + 7 * 24 * 60 * 60 * 1000);
    }

    const value = Number(match[1]);
    switch (match[2]) {
      case 's':
        return new Date(now + value * 1000);
      case 'm':
        return new Date(now + value * 60_000);
      case 'h':
        return new Date(now + value * 3_600_000);
      case 'd':
        return new Date(now + value * 86_400_000);
      default:
        return new Date(now + 7 * 24 * 60 * 60 * 1000);
    }
  }
}
