"use client";

import { useQuery } from "@tanstack/react-query";
import { getReceipts } from "./api";

export function useReceipts(query: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["receipts", query],
    queryFn: () => getReceipts(query),
  });
}
