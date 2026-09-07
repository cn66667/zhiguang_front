import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { notificationService } from "@/services/notificationService";
import type {
  NotificationItem,
  NotificationStreamEvent
} from "@/types/notification";
import { formatDateTime } from "@/utils/time";

const LIST_LIMIT = 20;

type NotificationContextValue = {
  unreadCount: number;
  items: NotificationItem[];
  loading: boolean;
  hasMore: boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (entityType: string, entityId: string) => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

type NotificationProviderProps = {
  children: ReactNode;
};

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { tokens } = useAuth();
  const accessToken = tokens?.accessToken ?? null;

  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const seenEventIds = useRef<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [listRes, unreadRes] = await Promise.all([
        notificationService.list(accessToken, LIST_LIMIT, 0),
        notificationService.unread(accessToken)
      ]);
      setItems(listRes.items ?? []);
      setHasMore((listRes.items?.length ?? 0) >= LIST_LIMIT);
      if (typeof unreadRes.count === "number") {
        setUnreadCount(unreadRes.count);
      }
    } catch {
      // 静默失败，保持当前状态
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const loadMore = useCallback(async () => {
    if (!accessToken || loading) return;
    setLoading(true);
    try {
      const resp = await notificationService.list(accessToken, LIST_LIMIT, items.length);
      const more = resp.items ?? [];
      setItems(prev => {
        const existingIds = new Set(prev.map(item => item.id));
        return [...prev, ...more.filter(item => !existingIds.has(item.id))];
      });
      setHasMore(more.length >= LIST_LIMIT);
    } catch {
      // 静默失败
    } finally {
      setLoading(false);
    }
  }, [accessToken, loading, items.length]);

  const markAllRead = useCallback(async () => {
    if (!accessToken) return;
    try {
      await notificationService.readAll(accessToken);
      setUnreadCount(0);
      setItems(prev => prev.map(item => ({ ...item, isRead: 1 })));
    } catch {
      // 静默失败
    }
  }, [accessToken]);

  // 单条已读（实体维度）：点进详情后该帖子所有通知（点赞+收藏）置已读
  const markRead = useCallback(
    async (entityType: string, entityId: string) => {
      if (!accessToken) return;
      try {
        const resp = await notificationService.readOne(accessToken, entityType, entityId);
        setItems(prev =>
          prev.map(item =>
            item.entityType === entityType && item.entityId === entityId
              ? { ...item, isRead: 1 }
              : item
          )
        );
        if (typeof resp.unreadCount === "number") {
          setUnreadCount(resp.unreadCount);
        }
      } catch {
        // 静默失败
      }
    },
    [accessToken]
  );

  const open = useCallback(() => {
    setIsOpen(true);
    void refresh();
  }, [refresh]);

  const close = useCallback(() => setIsOpen(false), []);

  // SSE 订阅
  useEffect(() => {
    if (!accessToken) return;
    let disposed = false;
    const es = new EventSource(notificationService.streamUrl(accessToken));

    es.addEventListener("connected", () => {
      if (disposed) return;
      void refresh();
    });

    es.addEventListener("notification", (e) => {
      if (disposed) return;
      try {
        const data = JSON.parse((e as MessageEvent).data) as NotificationStreamEvent;
        if (!data?.eventId || seenEventIds.current.has(data.eventId)) return;
        seenEventIds.current.add(data.eventId);
        const live: NotificationItem = {
          id: 0,
          _eventId: data.eventId,
          actorId: data.actorId,
          actorNickname: data.actorNickname,
          actionType: data.actionType,
          entityType: data.entityType,
          entityId: data.entityId,
          content: data.content,
          isRead: 0,
          createdAt: formatDateTime(data.ts)
        };
        setUnreadCount(prev => prev + 1);
        setItems(prev => {
          const exists = prev.some(item =>
            item._eventId === data.eventId ||
            (item.actorId === data.actorId && item.entityId === data.entityId)
          );
          return exists ? prev : [live, ...prev];
        });
      } catch {
        // 忽略解析失败的帧
      }
    });

    es.onerror = () => {
      // EventSource 会自动重连
    };

    return () => {
      disposed = true;
      es.close();
    };
  }, [accessToken, refresh]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      unreadCount,
      items,
      loading,
      hasMore,
      isOpen,
      open,
      close,
      refresh,
      loadMore,
      markAllRead,
      markRead
    }),
    [unreadCount, items, loading, hasMore, isOpen, open, close, refresh, loadMore, markAllRead, markRead]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification 必须在 NotificationProvider 内部使用");
  }
  return context;
};
