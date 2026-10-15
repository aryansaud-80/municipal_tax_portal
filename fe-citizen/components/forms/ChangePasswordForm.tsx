"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useChangePassword, useLogout, getAuthErrorMessage } from "@/features/auth/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Needs an uppercase letter")
      .regex(/[a-z]/, "Needs a lowercase letter")
      .regex(/[0-9\W]/, "Needs a number or symbol"),
    confirmPassword: z.string().min(1, "Please confirm the new password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type Values = z.infer<typeof schema>;

export function ChangePasswordForm() {
  const change = useChangePassword();
  const logout = useLogout();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = (values: Values) => {
    change.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        // The backend revokes every session on password change,
        // so sign in again with the new password.
        onSuccess: () => {
          reset();
          logout.mutate();
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {change.isError ? (
        <div role="alert" className="rounded-[10px] bg-danger/10 px-4 py-3 text-sm text-danger">
          {getAuthErrorMessage(change.error)}
        </div>
      ) : null}
      <Field label="Current password" htmlFor="currentPassword" error={errors.currentPassword?.message} required>
        <Input id="currentPassword" type="password" autoComplete="current-password" {...register("currentPassword")} />
      </Field>
      <Field label="New password" htmlFor="newPassword" error={errors.newPassword?.message} required>
        <Input id="newPassword" type="password" autoComplete="new-password" {...register("newPassword")} />
      </Field>
      <Field label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword?.message} required>
        <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" loading={change.isPending}>
          {change.isPending ? "Updating…" : "Update password"}
        </Button>
      </div>
    </form>
  );
}
