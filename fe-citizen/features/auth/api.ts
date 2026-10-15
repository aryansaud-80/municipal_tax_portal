import { apiClient } from "@/lib/axios";
import { LoginRequest, LoginResponse, User } from "./types";
import { RegisterValues } from "./schema";

export async function loginRequest(
  payload: LoginRequest,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function registerRequest(
  payload: RegisterValues,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>(
    "/auth/register",
    payload,
  );
  return data;
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post("/auth/logout");
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
  const { data } = await apiClient.get("/auth/me");
  return data.data;
}
