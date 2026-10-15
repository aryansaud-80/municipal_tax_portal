"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApplications, reviewApplication } from "./api";

export const applicationsKey = ["verification", "applications"] as const;

export function useApplications(status?: string) {
  return useQuery({
    queryKey: [...applicationsKey, status ?? "all"],
    queryFn: () => getApplications({ status, limit: 50 }),
  });
}

export function useReviewApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { decision: "approve" | "reject" | "request_correction"; reviewNotes?: string };
    }) => reviewApplication(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationsKey });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
