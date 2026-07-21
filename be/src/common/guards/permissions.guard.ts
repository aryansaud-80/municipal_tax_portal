import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  PERMISSIONS_MATCH_TYPE_KEY,
} from '../constants/authorization.constants';
import { IS_PUBLIC_KEY } from '../../modules/auth/constants/auth.constants';
import { PermissionMatchType } from '../types/permission-match-type.type';
import { PermissionsCheckerService } from '../services/permission-checker.service';
import { AuthenticatedUser } from '../../modules/auth/interfaces/authenticated-user.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsChecker: PermissionsCheckerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length) {
      return true;
    }

    const matchType =
      this.reflector.getAllAndOverride<PermissionMatchType>(
        PERMISSIONS_MATCH_TYPE_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? 'ANY';

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const grantedCodes =
      user.permissions ??
      (await this.permissionsChecker.getUserPermissionCodes(user.id));

    const grantedSet = new Set(grantedCodes);
    const missing = requiredPermissions.filter(
      (code) => !grantedSet.has(code),
    );

    const allowed =
      matchType === 'ALL'
        ? missing.length === 0
        : missing.length < requiredPermissions.length;

    if (!allowed) {
      throw new ForbiddenException(
        `Missing required permission(s): ${missing.join(', ')}`,
      );
    }

    return true;
  }
}