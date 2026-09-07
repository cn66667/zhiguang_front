import { useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import NotificationPanel from "./NotificationPanel";
import { BellIcon } from "@/components/icons/Icon";
import styles from "./NotificationBell.module.css";

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount, isOpen, open, close } = useNotification();
  const [loginHint, setLoginHint] = useState(false);

  const handleClick = () => {
    if (!user) {
      setLoginHint(true);
      return;
    }
    if (isOpen) {
      close();
    } else {
      open();
    }
  };

  return (
    <>
      <button
        type="button"
        className={`${styles.bell} ${isOpen ? styles.bellActive : ""}`}
        onClick={handleClick}
        aria-label="消息通知"
        title="消息通知"
      >
        <span className={styles.iconWrap}>
          <BellIcon width={28} height={28} />
          {unreadCount > 0 ? (
            <span className={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
          ) : null}
        </span>
        <span className={styles.label}>消息</span>
      </button>
      {user ? <NotificationPanel open={isOpen} onClose={close} /> : null}
      {loginHint
        ? createPortal(
            <div className={styles.hintOverlay} onClick={() => setLoginHint(false)}>
              <div className={styles.hintDialog} onClick={e => e.stopPropagation()}>
                <div className={styles.hintTitle}>提示</div>
                <div className={styles.hintText}>登录后即可查看消息通知</div>
                <div className={styles.hintActions}>
                  <button
                    type="button"
                    className={styles.hintCancel}
                    onClick={() => setLoginHint(false)}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className={styles.hintConfirm}
                    onClick={() => {
                      setLoginHint(false);
                      navigate("/login", {
                        state: { from: location.pathname + location.search + location.hash }
                      });
                    }}
                  >
                    去登录
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
};

export default NotificationBell;
