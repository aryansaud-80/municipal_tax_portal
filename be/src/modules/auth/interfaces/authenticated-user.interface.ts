export interface AuthenticatedUser {
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  status?: string;
  roles?: string[];
  permissions?: string[];
}
