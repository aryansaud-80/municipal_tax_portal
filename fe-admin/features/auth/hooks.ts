"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { loginRequest } from "./api";
import { LoginRequest, LoginResponse, ApiErrorResponse } from "./types";

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

/**
 * Extracts a display-ready message from an Axios error shaped by our
 * GlobalExceptionFilter on the NestJS side, forwarded as-is by the BFF.
 */
export function getLoginErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const message = axiosError.response?.data?.message;

    if (Array.isArray(message)) return message[0];
    if (typeof message === "string") return message;
  }

  return "Something went wrong. Please try again.";
}
