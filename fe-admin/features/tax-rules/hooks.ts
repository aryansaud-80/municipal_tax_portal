"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTaxRule, deactivateTaxRule, getTaxRules, updateTaxRule } from "./api";

export const taxRulesKey = ["tax-rules"] as const;

export function useTaxRules(fiscalYear?: string) {
  return useQuery({
    queryKey: [...taxRulesKey, fiscalYear ?? "all"],
    queryFn: () => getTaxRules({ fiscalYear }),
  });
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: taxRulesKey });
}

export function useCreateTaxRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTaxRule,
    onSuccess: () => invalidate(queryClient),
  });
}

export function useUpdateTaxRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      updateTaxRule(id, payload),
    onSuccess: () => invalidate(queryClient),
  });
}

export function useDeactivateTaxRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateTaxRule,
    onSuccess: () => invalidate(queryClient),
  });
}
