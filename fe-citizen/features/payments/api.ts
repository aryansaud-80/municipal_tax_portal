import { apiClient } from "@/lib/axios";
import { Payment, Paginated, ApiResponse } from "@/lib/types";

export interface CreatePaymentPayload {
  taxAssessmentId: string;
  amount: number;
  method: string;
}

export async function getMyPayments(): Promise<Paginated<Payment>> {
  // The backend has no `/payments` shorthand without a user scope; resolve
  // the current user via the profile endpoint first (same as the old BFF).
  const { data: profile } = await apiClient.post("/auth/profile", {});
  const userId: string | null = profile?.data?.id ?? null;
  if (!userId) throw new Error("Not authenticated");
  const { data } = await apiClient.get<ApiResponse<Paginated<Payment>>>(
    "/payments",
    { params: { userId, limit: 50 } },
  );
  return data.data;
}

export async function createPayment(
  payload: CreatePaymentPayload,
): Promise<Payment> {
  const { data } = await apiClient.post<ApiResponse<Payment>>(
    "/payments",
    payload,
  );
  return data.data;
}
