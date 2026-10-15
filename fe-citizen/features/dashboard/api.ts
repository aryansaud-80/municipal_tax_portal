import { apiClient } from "@/lib/axios";
import { CitizenDashboard } from "@/lib/types";

export async function getCitizenDashboard(): Promise<CitizenDashboard> {
  const { data } = await apiClient.get("/dashboard/citizen");
  return data.data;
}
