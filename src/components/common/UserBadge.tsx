import styles from "./UserBadge.module.css";
import { nicknameDecorClass } from "@/utils/nicknameDecor";

type UserBadgeProps = {
  name: string;
  alias?: string;
  avatarUrl?: string;
  decor?: string;
};

const getInitial = (value: string) => value.trim().charAt(0).toUpperCase() || "?";

const UserBadge = ({ name, alias, avatarUrl, decor }: UserBadgeProps) => {
  return (
    <div className={styles.badge}>
      <div className={styles.avatar}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" className={styles.avatarImg} />
        ) : (
          getInitial(name)
        )}
      </div>
      <div className={styles.meta}>
        <span className={`${styles.name} ${nicknameDecorClass(decor)}`}>{name}</span>
        {alias ? <span className={styles.alias}>{alias}</span> : null}
      </div>
    </div>
  );
};

export default UserBadge;
