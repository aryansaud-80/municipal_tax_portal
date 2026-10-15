import { apiClient } from "@/lib/axios";
import { TaxAssessment, ApiResponse } from "@/lib/types";

export async function getMyAssessments(): Promise<TaxAssessment[]> {
  // The backend exposes assessments per user at
  // `/tax-assessments/user/:userId`; resolve the id via profile first
  // (same as the old BFF did server-side).
  const { data: profile } = await apiClient.post("/auth/profile", {});
  const userId: string | null = profile?.data?.id ?? null;
  if (!userId) throw new Error("Not authenticated");
  const { data } = await apiClient.get<ApiResponse<TaxAssessment[]>>(
    `/tax-assessments/user/${userId}`,
  );
  return data.data;
}
