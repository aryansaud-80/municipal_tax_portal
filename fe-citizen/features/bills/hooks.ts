"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmMockPayment,
  getBill,
  getBillFines,
  getMyBills,
  initiateOnlinePayment,
} from "./api";

export const billsKey = ["bills", "my"] as const;

export function useMyBills() {
  return useQuery({ queryKey: billsKey, queryFn: getMyBills });
}

export function useBill(id: string | null) {
  return useQuery({
    queryKey: ["bills", id],
    queryFn: () => getBill(id!),
    enabled: !!id,
  });
}

export function useBillFines(billId: string | null) {
  return useQuery({
    queryKey: ["bills", billId, "fines"],
    queryFn: () => getBillFines(billId!),
    enabled: !!billId,
  });
}

export function useInitiatePayment() {
  return useMutation({ mutationFn: (billId: string) => initiateOnlinePayment(billId) });
}

export function useConfirmMockPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: confirmMockPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billsKey });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
