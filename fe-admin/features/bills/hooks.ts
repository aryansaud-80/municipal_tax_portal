"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  amendBill,
  applyFine,
  bulkIssueBills,
  cancelBill,
  getBillFines,
  getBills,
  issueBill,
  markOverdue,
  recordOfficePayment,
  waiveFine,
} from "./api";
import { useQuery } from "@tanstack/react-query";


export const billsKey = ["bills"] as const;

export function useBills(params: { status?: string; overdueOnly?: boolean } = {}) {
  return useQuery({
    queryKey: [...billsKey, params.status ?? "all", params.overdueOnly ? "od" : "x"],
    queryFn: () => getBills({ ...params, limit: 50 }),
  });
}

function refresh(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: billsKey });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["fines"] });
  queryClient.invalidateQueries({ queryKey: ["payments"] });
}

export function useIssueBill() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: issueBill, onSuccess: () => refresh(queryClient) });
}

export function useBulkIssue() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: bulkIssueBills, onSuccess: () => refresh(queryClient) });
}

export function useAmendBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof amendBill>[1] }) =>
      amendBill(id, payload),
    onSuccess: () => refresh(queryClient),
  });
}

export function useCancelBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelBill(id, reason),
    onSuccess: () => refresh(queryClient),
  });
}

export function useMarkOverdue() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: markOverdue, onSuccess: () => refresh(queryClient) });
}

export function useBillFines(billId: string | null) {
  return useQuery({
    queryKey: ["fines", billId],
    queryFn: () => getBillFines(billId!),
    enabled: !!billId,
  });
}

export function useApplyFine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ billId, periodLabel }: { billId: string; periodLabel?: string }) =>
      applyFine(billId, periodLabel),
    onSuccess: () => refresh(queryClient),
  });
}

export function useWaiveFine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => waiveFine(id, reason),
    onSuccess: () => refresh(queryClient),
  });
}

export function useRecordOfficePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recordOfficePayment,
    onSuccess: () => refresh(queryClient),
  });
}
