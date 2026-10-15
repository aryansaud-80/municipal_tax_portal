import { apiClient } from "@/lib/axios";
import { Property, Paginated, ApiResponse } from "@/lib/types";

export interface PropertyQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  propertyType?: string;
}

export async function getProperties(
  query: PropertyQuery = {},
): Promise<Paginated<Property>> {
  const { data } = await apiClient.get<ApiResponse<Paginated<Property>>>(
    "/properties",
    { params: query },
  );
  return data.data;
}
