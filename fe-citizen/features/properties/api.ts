import { apiClient } from "@/lib/axios";
import { Property, ApiResponse } from "@/lib/types";

export interface CreatePropertyPayload {
  ownerName: string;
  address: string;
  ward: number;
  tole?: string;
  areaSqMeters: number;
  propertyType: string;
  landOwnershipNumber?: string;
  floorCount?: number;
  buildingAgeYears?: number;
}

export async function getMyProperties(): Promise<Property[]> {
  const { data } = await apiClient.get<ApiResponse<Property[]>>(
    "/properties/my",
  );
  return data.data;
}

export async function createProperty(
  payload: CreatePropertyPayload,
): Promise<Property> {
  const { data } = await apiClient.post<ApiResponse<Property>>(
    "/properties/my",
    payload,
  );
  return data.data;
}
