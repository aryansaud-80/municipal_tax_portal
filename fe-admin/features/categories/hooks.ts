"use client";

import { useQuery } from "@tanstack/react-query";
import { getTaxCategories } from "./api";

export function useTaxCategories() {
  return useQuery({
    queryKey: ["tax-categories"],
    queryFn: getTaxCategories,
  });
}
