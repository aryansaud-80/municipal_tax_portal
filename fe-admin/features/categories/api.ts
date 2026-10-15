import { apiClient } from "@/lib/axios";
import { TaxCategory, ApiResponse } from "@/lib/types";

export async function getTaxCategories(): Promise<TaxCategory[]> {
  const { data } = await apiClient.get<ApiResponse<TaxCategory[]>>(
    "/tax-categories",
  );
  return data.data;
}
