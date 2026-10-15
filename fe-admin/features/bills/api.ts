import { apiClient } from "@/lib/axios";
import { Bill, Paginated, ApiResponse } from "@/lib/types";

export async function getBills(params: {
  page?: number;
  limit?: number;
  status?: string;
  fiscalYear?: string;
  overdueOnly?: boolean;
} = {}): Promise<Paginated<Bill>> {
  const { data } = await apiClient.get<ApiResponse<Paginated<Bill>>>("/bills", {
    params,
  });
  return data.data;
}

export async function issueBill(payload: Record<string, unknown>): Promise<Bill> {
  const { data } = await apiClient.post<ApiResponse<Bill>>("/bills", payload);
  return data.data;
}

export async function bulkIssueBills(payload: Record<string, unknown>): Promise<{
  issued: Bill[];
  skipped: Array<{ subject: string; reason: string }>;
  summary: { issued: number; skipped: number };
}> {
  const { data } = await apiClient.post("/bills/bulk", payload);
  return data.data;
}

export async function amendBill(
  id: string,
  payload: { adjustments?: Array<{ label: string; amount: number; reason?: string }>; discount?: number; reason: string },
): Promise<Bill> {
  const { data } = await apiClient.patch<ApiResponse<Bill>>(`/bills/${id}/amend`, payload);
  return data.data;
}

export async function cancelBill(id: string, reason: string): Promise<Bill> {
  const { data } = await apiClient.patch<ApiResponse<Bill>>(`/bills/${id}/cancel`, { reason });
  return data.data;
}

export async function markOverdue(): Promise<{ marked: number }> {
  const { data } = await apiClient.post("/bills/mark-overdue", {});
  return data.data;
}

export async function getBillFines(billId: string) {
  const { data } = await apiClient.get(`/fines/bills/${billId}`);
  return data.data;
}

export async function applyFine(billId: string, periodLabel?: string) {
  const { data } = await apiClient.post(`/fines/bills/${billId}/apply`, { periodLabel });
  return data.data;
}

export async function waiveFine(id: string, reason: string) {
  const { data } = await apiClient.patch(`/fines/${id}/waive`, { reason });
  return data.data;
}

export async function recordOfficePayment(payload: {
  billId: string;
  amount: number;
  method: string;
  referenceNumber?: string;
}) {
  const { data } = await apiClient.post("/payments/office", payload);
  return data.data;
}
