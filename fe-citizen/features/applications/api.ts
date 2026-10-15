import { apiClient } from "@/lib/axios";
import { PropertyApplication, ApiResponse } from "@/lib/types";
import { CreatePropertyPayload } from "@/features/properties/api";

export async function getMyApplications(): Promise<PropertyApplication[]> {
  const { data } = await apiClient.get<ApiResponse<PropertyApplication[]>>(
    "/property-applications/my",
  );
  return data.data;
}

export async function submitApplication(
  payload: CreatePropertyPayload,
): Promise<PropertyApplication> {
  const { data } = await apiClient.post<ApiResponse<PropertyApplication>>(
    "/property-applications/my",
    payload,
  );
  return data.data;
}

export async function resubmitApplication(
  id: string,
  payload: CreatePropertyPayload,
): Promise<PropertyApplication> {
  const { data } = await apiClient.patch<ApiResponse<PropertyApplication>>(
    `/property-applications/${id}/resubmit`,
    payload,
  );
  return data.data;
}

export async function uploadApplicationDocument(
  id: string,
  file: File,
): Promise<unknown> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post(`/property-applications/${id}/documents`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
}
