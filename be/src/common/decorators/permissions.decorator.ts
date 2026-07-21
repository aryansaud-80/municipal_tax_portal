import { applyDecorators, SetMetadata } from '@nestjs/common';
import {
  PERMISSIONS_KEY,
  PERMISSIONS_MATCH_TYPE_KEY,
} from '../constants/authorization.constants';
import { PermissionMatchType } from '../types/permission-match-type.type';


export const Permissions = (
  codes: string | string[],
  matchType: PermissionMatchType = 'ANY',
) =>
  applyDecorators(
    SetMetadata(PERMISSIONS_KEY, Array.isArray(codes) ? codes : [codes]),
    SetMetadata(PERMISSIONS_MATCH_TYPE_KEY, matchType),
  );