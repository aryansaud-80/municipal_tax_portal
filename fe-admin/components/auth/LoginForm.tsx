"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { loginSchema, LoginFormValues } from "@/features/auth/schema";
import { useLogin, getLoginErrorMessage } from "@/features/auth/hooks";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { RememberMe } from "@/components/auth/RememberMe";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { Spinner } from "@/components/common/Spinner";

export function LoginForm() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema) as any,
    defaultValues: { email: "", password: "", rememberMe: false },
    mode: "onBlur",
  });

  const { mutate, isPending, isError, error } = useLogin();

  const onSubmit = (values: LoginFormValues) => mutate(values);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {isError && <ErrorAlert message={getLoginErrorMessage(error)} />}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          placeholder="you@municipality.gov.np"
          invalid={Boolean(errors.email)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" role="alert" className="text-xs text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-teal-700 hover:text-teal-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          invalid={Boolean(errors.password)}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
        {errors.password && (
          <p id="password-error" role="alert" className="text-xs text-red-600">
            {errors.password.message}
          </p>
        )}
      </div>

      <RememberMe control={control} />

      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="w-full"
        aria-busy={isPending}
      >
        {isPending && <Spinner className="text-white" />}
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
