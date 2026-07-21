import { TokenType } from '../types/token-type.type';

export interface JwtPayload {
  sub: string;
  email: string;
  type: TokenType;
  jti?: string; 
  iat?: number;
  exp?: number;
}