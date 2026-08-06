import { apiClient } from "@/lib/axios";
import { LoginRequest, LoginResponse } from "./types";

export async function loginRequest(
  payload: LoginRequest,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
  return data;
}
