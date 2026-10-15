import { apiClient } from "@/lib/axios";
import { PropertyApplication, Paginated, ApiResponse } from "@/lib/types";

export async function getApplications(params: {
  page?: number;
  limit?: number;
  status?: string;
  ward?: number;
} = {}): Promise<Paginated<PropertyApplication>> {
  const { data } = await apiClient.get<ApiResponse<Paginated<PropertyApplication>>>(
    "/property-applications",
    { params },
  );
  return data.data;
}

export async function reviewApplication(
  id: string,
  payload: { decision: "approve" | "reject" | "request_correction"; reviewNotes?: string },
): Promise<PropertyApplication> {
  const { data } = await apiClient.patch<ApiResponse<PropertyApplication>>(
    `/property-applications/${id}/review`,
    payload,
  );
  return data.data;
}
