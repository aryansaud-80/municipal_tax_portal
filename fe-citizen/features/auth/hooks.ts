"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import {
  changePasswordRequest,
  loginRequest,
  registerRequest,
  logoutRequest,
  meRequest,
} from "./api";
import { LoginRequest, LoginResponse, ApiErrorResponse } from "./types";
import { RegisterValues } from "./schema";

const meKey = ["auth", "me"] as const;

export function useLogin() {
  const router = useRouter();

  return useMutation<LoginResponse, AxiosError<ApiErrorResponse>, LoginRequest>(
    {
      mutationFn: loginRequest,
      onSuccess: () => {
        router.push("/dashboard");
        router.refresh();
      },
    },
  );
}

export function useRegister() {
  const router = useRouter();

  return useMutation<LoginResponse, AxiosError<ApiErrorResponse>, RegisterValues>(
    {
      mutationFn: registerRequest,
      onSuccess: () => {
        router.push("/dashboard");
        router.refresh();
      },
    },
  );
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutRequest,
    // Logout is a session boundary: the refresh token has been revoked
    // server-side and local tokens cleared, so leave via a full reload to
    // guarantee no authenticated state survives client-side.
    onSuccess: () => {
      queryClient.clear();
      window.location.assign("/login");
    },
    onError: () => {
      queryClient.clear();
      window.location.assign("/login");
    },
  });
}

export function useMe() {
  return useQuery({
    queryKey: meKey,
    queryFn: meRequest,
    retry: false,
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation<
    { message: string },
    AxiosError<ApiErrorResponse>,
    { currentPassword: string; newPassword: string }
  >({
    mutationFn: changePasswordRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meKey });
    },
  });
}

export function getAuthErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const message = axiosError.response?.data?.message;
    if (Array.isArray(message)) return message[0];
    if (typeof message === "string") return message;
  }
  return "Something went wrong. Please try again.";
}
