import { apiClient } from "@/lib/axios";
import { TaxAssessment, Paginated, ApiResponse } from "@/lib/types";

export interface TaxAssessmentQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  fiscalYear?: string;
  taxCategoryId?: string;
}

export async function getTaxAssessments(
  query: TaxAssessmentQuery = {},
): Promise<Paginated<TaxAssessment>> {
  const { data } = await apiClient.get<ApiResponse<Paginated<TaxAssessment>>>(
    "/tax-assessments",
    { params: query },
  );
  return data.data;
}
