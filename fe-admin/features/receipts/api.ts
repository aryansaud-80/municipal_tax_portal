import { apiClient } from "@/lib/axios";
import { Receipt, Paginated, ApiResponse } from "@/lib/types";

export async function getReceipts(
  query: { page?: number; limit?: number } = {},
): Promise<Paginated<Receipt>> {
  const { data } = await apiClient.get<ApiResponse<Paginated<Receipt>>>(
    "/receipts",
    { params: query },
  );
  return data.data;
}
