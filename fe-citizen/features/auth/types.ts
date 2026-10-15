export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  status: string;
  roles?: string[];
  permissions?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  roles: string[];
  permissions: string[];
  expiresIn?: number;
}

export interface ApiErrorResponse {
  success?: boolean;
  statusCode?: number;
  message?: string | string[];
  error?: string;
}
