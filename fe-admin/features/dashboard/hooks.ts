"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard } from "./api";

const dashboardKey = ["dashboard", "admin"] as const;

export function useAdminDashboard() {
  return useQuery({
    queryKey: dashboardKey,
    queryFn: getAdminDashboard,
  });
}

export { dashboardKey };
