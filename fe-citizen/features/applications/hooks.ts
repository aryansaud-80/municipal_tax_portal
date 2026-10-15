"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyApplications,
  resubmitApplication,
  submitApplication,
  uploadApplicationDocument,
} from "./api";
import { CreatePropertyPayload } from "@/features/properties/api";

export const applicationsKey = ["property-applications", "my"] as const;

export function useMyApplications() {
  return useQuery({ queryKey: applicationsKey, queryFn: getMyApplications });
}

export function useSubmitApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationsKey });
    },
  });
}

export function useResubmitApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreatePropertyPayload }) =>
      resubmitApplication(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationsKey });
    },
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      uploadApplicationDocument(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationsKey });
    },
  });
}
