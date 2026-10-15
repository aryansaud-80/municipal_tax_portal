import { apiClient } from "@/lib/axios";
import { Payment, Paginated, ApiResponse } from "@/lib/types";

export interface CreatePaymentPayload {
  taxAssessmentId: string;
  amount: number;
  method: string;
}

export async function getMyPayments(): Promise<Paginated<Payment>> {
  const { data } = await apiClient.get<ApiResponse<Paginated<Payment>>>(
    "/payments",
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
