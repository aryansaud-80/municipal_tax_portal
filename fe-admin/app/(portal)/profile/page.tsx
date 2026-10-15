"use client";

import { UserRound, KeyRound, ShieldCheck } from "lucide-react";
import { useMe } from "@/features/auth/hooks";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, ErrorState } from "@/components/shared/States";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ChangePasswordForm } from "@/components/forms/ChangePasswordForm";

export default function ProfilePage() {
  const { data: user, isLoading, isError, refetch } = useMe();

  if (isLoading) return <LoadingState label="Loading profile..." />;
  if (isError || !user) {
    return (
      <ErrorState
        message="Unable to load your profile. Check your connection and try again."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description="Your staff account, roles and security." />

      <div className="grid max-w-3xl gap-6">
        <Card className="p-2">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <UserRound className="h-8 w-8" aria-hidden />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-xl">
                  {user.firstName} {user.lastName}
                </CardTitle>
                <CardDescription className="truncate">{user.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-[10px] border p-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Status
              </p>
              <p className="mt-1.5">
                <StatusBadge status="active" />
              </p>
            </div>
            <div className="rounded-[10px] border p-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Roles
              </p>
              <p className="mt-1.5 flex flex-wrap gap-1.5">
                {(user.roles ?? []).length > 0 ? (
                  (user.roles ?? []).map((r) => (
                    <Badge key={r} variant="secondary">
                      {r}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </p>
            </div>
            <div className="rounded-[10px] border p-4 sm:col-span-2">
              <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Permissions (
                {(user.permissions ?? []).length})
              </p>
              <p className="mt-1.5 flex max-h-32 flex-wrap gap-1.5 overflow-y-auto scrollbar-slim">
                {(user.permissions ?? []).map((p) => (
                  <Badge key={p} variant="outline" className="font-mono text-[11px]">
                    {p}
                  </Badge>
                ))}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
                <KeyRound className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-base">Change password</CardTitle>
                <CardDescription>
                  You will be signed out on all devices after changing it.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
