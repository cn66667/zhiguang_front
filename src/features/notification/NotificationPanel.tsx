import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useNotification } from "@/context/NotificationContext";
import type { NotificationItem } from "@/types/notification";
import styles from "./NotificationPanel.module.css";

type NotificationPanelProps = {
  open: boolean;
  onClose: () => void;
};

const initialChar = (name?: string | null) =>
  (name?.trim().charAt(0).toUpperCase() || "知");

const NotificationPanel = ({ open, onClose }: NotificationPanelProps) => {
  const navigate = useNavigate();
  const { items, loading, hasMore, loadMore, markAllRead, markRead } = useNotification();
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    // 打开时让此前聚焦的元素（如搜索输入框）立即失焦，并把焦点移入弹窗
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body) {
      active.blur();
    }
    modalRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleItemClick = (item: NotificationItem) => {
    if (item.entityId) {
      if (!item.isRead) void markRead(item.entityType, item.entityId);
      navigate(`/post/${item.entityId}`);
    }
    onClose();
  };

  // 通过 Portal 渲染到 body，脱离侧边栏（sticky 创建的层叠上下文），
  // 确保遮罩与弹窗始终覆盖全页内容
  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} ref={modalRef} tabIndex={-1} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>消息通知</span>
          <div className={styles.headerActions}>
            <button type="button" className={styles.readAll} onClick={() => void markAllRead()}>
              全部已读
            </button>
            <button type="button" className={styles.close} onClick={onClose}>
              关闭
            </button>
          </div>
        </div>
        <div className={styles.body}>
          {items.length === 0 && !loading ? (
            <div className={styles.empty}>暂无消息</div>
          ) : (
            <div className={styles.list}>
              {items.map(item => (
                <div
                  key={item._eventId ?? item.id}
                  className={`${styles.item} ${item.isRead ? styles.itemRead : ""}`}
                  onClick={() => handleItemClick(item)}
                >
                  {item.actorAvatar ? (
                    <img className={styles.avatar} src={item.actorAvatar} alt={item.actorNickname ?? "用户"} />
                  ) : (
                    <div className={styles.avatar}>{initialChar(item.actorNickname)}</div>
                  )}
                  <div className={styles.itemBody}>
                    <div className={styles.itemContent}>
                      {!item.isRead ? <span className={styles.dot} /> : null}
                      <span className={styles.itemText}>{item.content}</span>
                    </div>
                    <div className={styles.itemMeta}>
                      {item.actorNickname ? <span>{item.actorNickname}</span> : null}
                      <span>{item.createdAt}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.more}
            onClick={() => void loadMore()}
            disabled={!hasMore || loading}
          >
            {loading ? "加载中..." : hasMore ? "加载更多" : "没有更多了"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NotificationPanel;
