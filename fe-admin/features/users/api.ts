import { apiClient } from "@/lib/axios";
import { User, Paginated, ApiResponse } from "@/lib/types";

export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phoneNumber: string;
  password: string;
  roleCode: string;
}

export async function getUsers(query: UserQuery = {}): Promise<Paginated<User>> {
  const { data } = await apiClient.get<ApiResponse<Paginated<User>>>("/users", {
    params: query,
  });
  return data.data;
}

export async function createUser(
  payload: CreateUserInput,
): Promise<User> {
  const { data } = await apiClient.post<ApiResponse<User>>("/users", payload);
  return data.data;
}

export async function toggleUserStatus(
  id: string,
  isActive: boolean,
): Promise<User> {
  const { data } = await apiClient.patch<ApiResponse<User>>(
    `/users/${id}/status`,
    { isActive },
  );
  return data.data;
}
