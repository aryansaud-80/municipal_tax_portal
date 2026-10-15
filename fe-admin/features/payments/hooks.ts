"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPayments, verifyPayment, PaymentQuery } from "./api";

export const paymentsKey = ["payments", "admin"] as const;

export function usePayments(query: PaymentQuery) {
  return useQuery({
    queryKey: [paymentsKey, query],
    queryFn: () => getPayments(query),
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifyPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentsKey });
      queryClient.invalidateQueries({ queryKey: ["tax-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "admin"] });
    },
  });
}
