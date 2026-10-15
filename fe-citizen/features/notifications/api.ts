import { apiClient } from "@/lib/axios";
import { Notification, ApiResponse } from "@/lib/types";

export async function getNotifications(): Promise<Notification[]> {
  const { data } = await apiClient.get<ApiResponse<Notification[]>>(
    "/notifications",
  );
  return data.data;
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<ApiResponse<{ count: number }>>(
    "/notifications/unread-count",
  );
  return data.data.count;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch("/notifications/read-all");
}
