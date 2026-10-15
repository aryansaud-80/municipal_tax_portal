"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuditEvents, getEmployeeProfiles, upsertEmployeeProfile } from "./api";

export function useAuditEvents() {
  return useQuery({ queryKey: ["audit"], queryFn: getAuditEvents });
}

export function useEmployeeProfiles() {
  return useQuery({ queryKey: ["employees"], queryFn: getEmployeeProfiles });
}

export function useUpsertEmployeeProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: upsertEmployeeProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
}
