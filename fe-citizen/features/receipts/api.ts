import { apiClient } from "@/lib/axios";
import { Receipt, Paginated, ApiResponse } from "@/lib/types";

export async function getMyReceipts(): Promise<Receipt[]> {
  const { data } = await apiClient.get<ApiResponse<Receipt[]>>(
    "/receipts/my",
  );
  return data.data;
}
