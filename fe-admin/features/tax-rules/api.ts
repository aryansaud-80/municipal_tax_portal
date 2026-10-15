import { apiClient } from "@/lib/axios";
import { TaxRule, ApiResponse } from "@/lib/types";

export async function getTaxRules(params: {
  taxCategoryId?: string;
  fiscalYear?: string;
} = {}): Promise<TaxRule[]> {
  const { data } = await apiClient.get<ApiResponse<TaxRule[]>>("/tax-rules", {
    params,
  });
  return data.data;
}

export async function createTaxRule(payload: Record<string, unknown>): Promise<TaxRule> {
  const { data } = await apiClient.post<ApiResponse<TaxRule>>("/tax-rules", payload);
  return data.data;
}

export async function updateTaxRule(id: string, payload: Record<string, unknown>): Promise<TaxRule> {
  const { data } = await apiClient.patch<ApiResponse<TaxRule>>(`/tax-rules/${id}`, payload);
  return data.data;
}

export async function deactivateTaxRule(id: string): Promise<TaxRule> {
  const { data } = await apiClient.patch<ApiResponse<TaxRule>>(`/tax-rules/${id}`, {
    isActive: false,
  });
  return data.data;
}
