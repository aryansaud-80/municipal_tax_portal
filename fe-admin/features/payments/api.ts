import { apiClient } from "@/lib/axios";
import { Payment, Paginated, ApiResponse } from "@/lib/types";

export interface PaymentQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  method?: string;
}

export async function getPayments(
  query: PaymentQuery = {},
): Promise<Paginated<Payment>> {
  const { data } = await apiClient.get<ApiResponse<Paginated<Payment>>>(
    "/payments",
    { params: query },
  );
  return data.data;
}

export async function verifyPayment(id: string): Promise<Payment> {
  const { data } = await apiClient.post<ApiResponse<Payment>>(
    `/payments/${id}/verify`,
  );
  return data.data;
}
