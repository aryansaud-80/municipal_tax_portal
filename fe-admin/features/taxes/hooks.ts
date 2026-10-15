"use client";

import { useQuery } from "@tanstack/react-query";
import { getTaxAssessments, TaxAssessmentQuery } from "./api";

export function useTaxAssessments(query: TaxAssessmentQuery) {
  return useQuery({
    queryKey: ["tax-assessments", query],
    queryFn: () => getTaxAssessments(query),
  });
}
