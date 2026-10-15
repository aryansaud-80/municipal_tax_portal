"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyReceipts } from "./api";

export const receiptsKey = ["receipts", "my"] as const;

export function useMyReceipts() {
  return useQuery({
    queryKey: receiptsKey,
    queryFn: getMyReceipts,
  });
}
