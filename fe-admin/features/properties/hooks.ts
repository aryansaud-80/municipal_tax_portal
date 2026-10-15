"use client";

import { useQuery } from "@tanstack/react-query";
import { getProperties, PropertyQuery } from "./api";

export function useProperties(query: PropertyQuery) {
  return useQuery({
    queryKey: ["properties", query],
    queryFn: () => getProperties(query),
  });
}
