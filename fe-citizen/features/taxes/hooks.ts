"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyAssessments } from "./api";

export const assessmentsKey = ["tax-assessments", "my"] as const;

export function useMyAssessments() {
  return useQuery({
    queryKey: assessmentsKey,
    queryFn: getMyAssessments,
  });
}
