export type NotificationActionType = "like" | "fav";

export type NotificationItem = {
  id: number;
  _eventId?: string;
  actorId: number;
  actorNickname: string | null;
  actorAvatar?: string | null;
  actionType: NotificationActionType | string;
  entityType: string;
  entityId: string;
  content: string;
  isRead: number;
  createdAt: string;
};

export type NotificationListResponse = {
  items: NotificationItem[];
  unreadCount: number;
};

export type NotificationUnreadResponse = {
  count: number;
};

export type NotificationReadResponse = {
  success: boolean;
  unreadCount?: number;
};

export type NotificationStreamEvent = {
  eventId: string;
  actorId: number;
  actorNickname: string;
  actionType: NotificationActionType | string;
  entityType: string;
  entityId: string;
  title: string;
  content: string;
  ts: number;
};
