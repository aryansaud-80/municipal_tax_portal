import { apiClient } from "@/lib/axios";
import { Bill, Fine, ApiResponse } from "@/lib/types";

export async function getMyBills(): Promise<Bill[]> {
  const { data } = await apiClient.get<ApiResponse<Bill[]>>("/bills/my");
  return data.data;
}

export async function getBill(id: string): Promise<Bill> {
  const { data } = await apiClient.get<ApiResponse<Bill>>(`/bills/${id}`);
  return data.data;
}

export async function getBillFines(billId: string): Promise<Fine[]> {
  const { data } = await apiClient.get<ApiResponse<Fine[]>>(
    `/bills/${billId}/fines`,
  );
  return data.data;
}

export interface InitiateResult {
  payment: { id: string; status: string };
  checkout: { providerRef: string; amount: number; currency: string };
}

export async function initiateOnlinePayment(
  billId: string,
  amount?: number,
): Promise<InitiateResult> {
  const { data } = await apiClient.post<ApiResponse<InitiateResult>>(
    "/payments/online/initiate",
    { billId, amount },
  );
  return data.data;
}

export async function confirmMockPayment(providerRef: string) {
  const { data } = await apiClient.post("/payments/online/mock-confirm", {
    providerRef,
  });
  return data.data;
}
