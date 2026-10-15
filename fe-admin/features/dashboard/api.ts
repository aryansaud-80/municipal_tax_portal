import { apiClient } from "@/lib/axios";
import { AdminDashboard, ApiResponse } from "@/lib/types";

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const { data } = await apiClient.get<ApiResponse<AdminDashboard>>(
    "/dashboard/admin",
  );
  return data.data;
}
