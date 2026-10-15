"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPayment, getMyPayments } from "./api";

export const paymentsKey = ["payments", "my"] as const;

export function useMyPayments() {
  return useQuery({
    queryKey: paymentsKey,
    queryFn: getMyPayments,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentsKey });
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: assessmentsKey });
    },
  });
}

export const assessmentsKey = ["tax-assessments", "my"] as const;
