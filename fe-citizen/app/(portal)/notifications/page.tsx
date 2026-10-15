"use client";

import { CheckCheck, BellRing } from "lucide-react";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/features/notifications/hooks";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { data, isLoading, isError, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Updates on your property and tax account."
        actions={
          data && data.length ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
            >
              <CheckCheck className="mr-1 h-4 w-4" /> Mark all read
            </Button>
          ) : null
        }
      />

      {isLoading ? (
        <LoadingState label="Loading notifications..." />
      ) : isError ? (
        <ErrorState
          message="Unable to load notifications."
          onRetry={() => refetch()}
        />
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title="No notifications"
              description="You're all caught up. New notifications will appear here."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                "transition-colors duration-150",
                !notification.isRead && "border-primary/40 bg-primary-soft/50",
              )}
            >
              <CardContent
                className="flex cursor-pointer items-start gap-3 p-4"
                onClick={() => {
                  if (!notification.isRead) markRead.mutate(notification.id);
                }}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    notification.isRead
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary-soft text-primary",
                  )}
                >
                  <BellRing className="h-[18px] w-[18px]" aria-hidden />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(notification.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                </div>
                {!notification.isRead ? (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
