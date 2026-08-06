export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthenticatedUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface LoginResponse {
  user: AuthenticatedUserDto;
  roles: string[];
  permissions: string[];
  expiresIn: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string | string[];
  path: string;
  timestamp: string;
}
