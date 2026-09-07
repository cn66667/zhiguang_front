import { apiFetch, getApiBaseUrl } from "./apiClient";
import type {
  NotificationListResponse,
  NotificationReadResponse,
  NotificationUnreadResponse
} from "@/types/notification";

const NOTIFICATION_PREFIX = "/api/v1/notification";

export const notificationService = {
  list: (accessToken: string, limit = 20, offset = 0) =>
    apiFetch<NotificationListResponse>(
      `${NOTIFICATION_PREFIX}/list?limit=${limit}&offset=${offset}`,
      { accessToken }
    ),

  unread: (accessToken: string) =>
    apiFetch<NotificationUnreadResponse>(`${NOTIFICATION_PREFIX}/unread`, {
      accessToken
    }),

  readAll: (accessToken: string) =>
    apiFetch<NotificationReadResponse>(`${NOTIFICATION_PREFIX}/read`, {
      method: "POST",
      accessToken
    }),

  readOne: (accessToken: string, entityType: string, entityId: string) =>
    apiFetch<NotificationReadResponse>(
      `${NOTIFICATION_PREFIX}/readOne?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`,
      { method: "POST", accessToken }
    ),

  streamUrl: (accessToken: string) =>
    `${getApiBaseUrl()}${NOTIFICATION_PREFIX}/stream?token=${encodeURIComponent(accessToken)}`
};
