"use client";

import { useQuery } from "@tanstack/react-query";
import { getCitizenDashboard } from "./api";

export const dashboardKey = ["dashboard", "citizen"] as const;

export function useCitizenDashboard() {
  return useQuery({
    queryKey: dashboardKey,
    queryFn: getCitizenDashboard,
  });
}
