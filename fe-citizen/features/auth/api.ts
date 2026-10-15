import { apiClient } from "@/lib/axios";
import { clearTokens, getRefreshToken, setTokens } from "@/lib/token-storage";
import { LoginRequest, LoginResponse, User } from "./types";
import { RegisterValues } from "./schema";

interface BackendAuthPayload {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  user: User;
  roles: string[];
  permissions: string[];
}

function persistAndShape(payload: BackendAuthPayload): LoginResponse {
  setTokens({
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    persistent: true,
  });
  return {
    user: payload.user,
    roles: payload.roles,
    permissions: payload.permissions,
    expiresIn: payload.expiresIn,
  };
}

export async function loginRequest(
  payload: LoginRequest,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<{ data: BackendAuthPayload }>(
    "/auth/login",
    { email: payload.email, password: payload.password },
  );
  return persistAndShape(data.data);
}

export async function registerRequest(
  payload: RegisterValues,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<{ data: BackendAuthPayload }>(
    "/auth/register",
    payload,
  );
  return persistAndShape(data.data);
}

export async function logoutRequest(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await apiClient.post("/auth/logout", { refreshToken });
    } catch {
      /* still log out locally even if the backend is unreachable */
    }
  }
  clearTokens();
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export async function changePasswordRequest(
  payload: ChangePasswordPayload,
): Promise<{ message: string }> {
  const { data } = await apiClient.patch<{ message: string }>(
    "/auth/change-password",
    payload,
  );
  return data;
}

export async function meRequest(): Promise<User> {
  const { data } = await apiClient.post("/auth/profile", {});
  return data.data;
}
