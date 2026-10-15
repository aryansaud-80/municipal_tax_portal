import { apiClient } from "@/lib/axios";
import { TaxAssessment, ApiResponse } from "@/lib/types";

export async function getMyAssessments(): Promise<TaxAssessment[]> {
  const { data } = await apiClient.get<ApiResponse<TaxAssessment[]>>(
    "/tax-assessments/user",
  );
  return data.data;
}
