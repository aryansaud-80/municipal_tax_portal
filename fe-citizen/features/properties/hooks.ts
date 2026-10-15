"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProperty, getMyProperties } from "./api";

export const propertiesKey = ["properties", "my"] as const;

export function useMyProperties() {
  return useQuery({
    queryKey: propertiesKey,
    queryFn: getMyProperties,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertiesKey });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
