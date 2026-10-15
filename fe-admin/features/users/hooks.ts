"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  createUser,
  getUsers,
  toggleUserStatus,
  UserQuery,
  CreateUserInput,
} from "./api";
import { ApiErrorResponse } from "@/features/auth/types";

export const usersKey = ["users"] as const;

export function useUsers(query: UserQuery) {
  return useQuery({
    queryKey: [usersKey, query],
    queryFn: () => getUsers(query),
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKey });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "admin"] });
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserInput) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKey });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "admin"] });
    },
  });
}

export function getCreateUserErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const message = axiosError.response?.data?.message;
    if (Array.isArray(message)) return message[0];
    if (typeof message === "string") return message;
  }
  return "Something went wrong. Please try again.";
}
