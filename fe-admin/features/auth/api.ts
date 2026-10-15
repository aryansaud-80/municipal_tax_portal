import { apiClient } from "@/lib/axios";
import { clearTokens, getRefreshToken, setTokens } from "@/lib/token-storage";
import { LoginRequest, LoginResponse, AuthenticatedUserDto } from "./types";

interface BackendLoginPayload {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: AuthenticatedUserDto;
  roles: string[];
  permissions: string[];
}

export async function loginRequest(
  payload: LoginRequest,
): Promise<LoginResponse> {
  // The backend DTO only accepts email/password (forbidNonWhitelisted), so
  // rememberMe is applied client-side to token persistence only.
  const { data } = await apiClient.post<{ data: BackendLoginPayload }>(
    "/auth/login",
    { email: payload.email, password: payload.password },
  );
  const { accessToken, refreshToken, expiresIn, user, roles, permissions } =
    data.data;
  setTokens({
    accessToken,
    refreshToken,
    persistent: payload.rememberMe ?? true,
  });
  return { user, roles, permissions, expiresIn };
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

export async function meRequest(): Promise<AuthenticatedUserDto | null> {
  try {
    const { data } = await apiClient.post<{
      data: AuthenticatedUserDto | null;
    }>("/auth/profile", {});
    return data.data;
  } catch {
    return null;
  }
}
