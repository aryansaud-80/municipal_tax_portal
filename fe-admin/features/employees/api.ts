import { apiClient } from "@/lib/axios";
import { AuditEvent, EmployeeProfile, ApiResponse } from "@/lib/types";

export async function getAuditEvents(): Promise<{ data: AuditEvent[]; meta: unknown }> {
  const { data } = await apiClient.get("/audit-events", { params: { limit: 50 } });
  return data.data;
}

export async function getEmployeeProfiles(): Promise<EmployeeProfile[]> {
  const { data } = await apiClient.get<ApiResponse<EmployeeProfile[]>>("/employee-profiles");
  return data.data;
}

export async function upsertEmployeeProfile(payload: {
  userId: string;
  position?: string;
  wardAssignments?: number[];
  canVerifyPayments?: boolean;
  canAssess?: boolean;
  canApproveProperty?: boolean;
}): Promise<EmployeeProfile> {
  const { data } = await apiClient.post<ApiResponse<EmployeeProfile>>("/employee-profiles", payload);
  return data.data;
}
