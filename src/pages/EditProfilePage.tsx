import { useEffect, useMemo, useRef, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import SectionHeader from "@/components/common/SectionHeader";
import TagInput from "@/components/common/TagInput";
import AuthStatus from "@/features/auth/AuthStatus";
import { useAuth } from "@/context/AuthContext";
import { profileService } from "@/services/profileService";
import { authService } from "@/services/authService";
import type { Gender, ProfileUpdateRequest } from "@/types/profile";
import { DECOR_OPTIONS, nicknameDecorClass, type NicknameDecor } from "@/utils/nicknameDecor";
import styles from "./EditProfilePage.module.css";
import { useNavigate } from "react-router-dom";

// 性别选择器选项：男/女/保密
const GENDER_OPTIONS: { label: string; value: Gender }[] = [
  { label: "男", value: "MALE" },
  { label: "女", value: "FEMALE" },
  { label: "保密", value: "UNKNOWN" },
];
const genderLabel = (g: Gender | "") => GENDER_OPTIONS.find((o) => o.value === g)?.label ?? "请选择";

const EditProfilePage = () => {
  const { user, tokens, /* refresh, logout, */ reloadUser } = useAuth();
  const navigate = useNavigate();
  const displayName = useMemo(
    () => user?.nickname ?? user?.phone ?? user?.email ?? "知光用户",
    [user]
  );

  const [nickname, setNickname] = useState<string>(user?.nickname ?? "");
  const [nicknameDecor, setNicknameDecor] = useState<NicknameDecor>("none");
  const [bio, setBio] = useState<string>(user?.bio ?? "");
  const [zgId, setZgId] = useState<string>(user?.zhId ?? "");
  const [gender, setGender] = useState<Gender | "">("");
  const [genderPickerOpen, setGenderPickerOpen] = useState<boolean>(false);
  const [tempGender, setTempGender] = useState<Gender | "">("");
  const [birthday, setBirthday] = useState<string>(user?.birthday ?? "");
  const [school, setSchool] = useState<string>(user?.school ?? "");
  const [phone, setPhone] = useState<string>(user?.phone ?? "");
  const [skills, setSkills] = useState<string[]>(user?.skills ?? []);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [showSaveSuccess, setShowSaveSuccess] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar ?? null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setSaveMessage("");
    try {
      const result = await profileService.uploadAvatar(file);
      setAvatarUrl(result.avatar || null);
      setSaveMessage("头像已更新");
      // 同步更新全局用户信息，刷新右上角头像
      try {
        await reloadUser?.();
      } catch {}
    } catch (error) {
      console.error(error);
      setSaveMessage("头像上传失败，请稍后重试");
    } finally {
      setUploading(false);
    }
  };

  const onAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage("");
    const payload: ProfileUpdateRequest = {};
    if (nickname.trim()) payload.nickname = nickname.trim();
    if (nicknameDecor) payload.nicknameDecor = nicknameDecor;
    if (bio.trim()) payload.bio = bio.trim();
    if (zgId.trim()) payload.zgId = zgId.trim();
    const genderNormalized: Gender | undefined =
      gender === "MALE" || gender === "FEMALE" || gender === "UNKNOWN" ? gender : undefined;
    if (genderNormalized) payload.gender = genderNormalized;
    if (birthday.trim()) payload.birthday = birthday.trim();
    if (school.trim()) payload.school = school.trim();
    if (phone.trim()) payload.phone = phone.trim();
    if (skills.length > 0) payload.tagJson = JSON.stringify(skills);

    try {
      await profileService.update(payload);
      setSaveMessage("资料已保存");
      setShowSaveSuccess(true);
      // 保存成功后，同步更新全局用户信息，返回“我的”页面可立即看到最新数据
      try {
        await reloadUser?.();
      } catch {}
    } catch (error) {
      console.error(error);
      setSaveMessage("保存失败，请稍后重试");
    } finally {
      setIsSaving(false);
    }
  };

  const avatarInitial = (displayName.trim().charAt(0) || "知").toUpperCase();

  // 进入页面时请求 auth/me，预填表单；带取消标记避免登出后回写旧数据
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (!tokens?.accessToken) return;
        const current = await authService.fetchCurrentUser(tokens.accessToken);
        if (cancelled) return;
        setNickname(current.nickname ?? "");
        const decor = current.nicknameDecor === "rainbow" || current.nicknameDecor === "gold" || current.nicknameDecor === "red" ? current.nicknameDecor : "none";
        setNicknameDecor(decor);
        setBio(current.bio ?? "");
        setZgId(current.zhId ?? "");
        setPhone(current.phone ?? "");
        setSchool(current.school ?? "");
        setBirthday(current.birthday ?? "");
        setAvatarUrl(current.avatar || null);
        if (current.gender === "MALE") setGender("MALE");
        else if (current.gender === "FEMALE") setGender("FEMALE");
        else if (current.gender === "OTHER" || current.gender === "UNKNOWN") setGender("UNKNOWN");
        else setGender("");
        if (Array.isArray(current.skills)) setSkills(current.skills);
        else if (typeof current.tagJson === "string") {
          try {
            const parsed = JSON.parse(current.tagJson);
            if (Array.isArray(parsed)) {
              setSkills(parsed.filter((x) => typeof x === "string"));
            }
          } catch (e) {
            console.warn("解析 tagJson 失败", e);
          }
        }
      } catch (error) {
        console.error("获取当前用户失败", error);
      }
    };
    void run();
    return () => { cancelled = true; };
    // 仅在进入页面时或令牌变化时触发
  }, [tokens?.accessToken]);

  // 退出登录时立刻清空本地个人信息状态，避免残留显示
  useEffect(() => {
    if (!tokens?.accessToken || !user) {
      setNickname("");
      setNicknameDecor("none");
      setBio("");
      setZgId("");
      setGender("");
      setGenderPickerOpen(false);
      setBirthday("");
      setSchool("");
      setPhone("");
      setSkills([]);
      setAvatarUrl(null);
    }
  }, [tokens?.accessToken, user]);

  return (
    <AppLayout
      variant="cardless"
      header={
        <MainHeader
          headline="编辑个人资料"
          subtitle="完善信息，帮助同学们更快认识你"
          rightSlot={<AuthStatus />}
        />
      }
    >
      <form className={styles.pageCard} onSubmit={onSubmit}>
        <SectionHeader
          title="基本信息"
          subtitle="头像、昵称、联系方式等"
          actions={<>
            <button type="button" className="ghost-button" onClick={() => navigate("/profile")}>返回</button>
            <button type="submit" className="ghost-button" disabled={isSaving}>{isSaving ? "保存中..." : "保存修改"}</button>
          </>}
        />

        <div className={styles.grid}>
          <div className={styles.avatarPanel}>
            <div className={styles.avatarPreview} onClick={onAvatarClick} role="button" aria-label="点击上传头像" tabIndex={0}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className={styles.avatarImg} />
              ) : (
                <span>{avatarInitial}</span>
              )}
            </div>
            {/* 隐藏的文件输入，由点击头像触发 */}
            <input ref={fileInputRef} id="avatar" type="file" accept="image/*" onChange={onAvatarFileChange} style={{ display: "none" }} />
            {uploading ? <span style={{ color: "var(--color-text-muted)" }}>上传中...</span> : null}
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="nickname">昵称</label>
              <input id="nickname" className={styles.input} value={nickname} onChange={e => setNickname(e.target.value)} placeholder="填写你的昵称" />
            </div>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label}>昵称装饰</label>
              <div className={styles.decorGroup}>
                {DECOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.decorOption} ${nicknameDecor === opt.value ? styles.decorOptionActive : ""}`}
                    onClick={() => setNicknameDecor(opt.value)}
                  >
                    <span className={nicknameDecorClass(opt.value)}>{nickname.trim() || "你的昵称"}</span>
                    <span className={styles.decorOptionLabel}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="phone">手机</label>
              <input id="phone" className={styles.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="绑定手机号方便联系" />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="zgId">知光 ID</label>
              <input id="zgId" className={styles.input} value={zgId} onChange={e => setZgId(e.target.value)} placeholder="用于个性化主页地址" />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="gender">性别</label>
              <button
                type="button"
                id="gender"
                className={styles.selectTrigger}
                onClick={() => {
                  setTempGender(gender);
                  setGenderPickerOpen(true);
                }}
              >
                <span className={gender ? styles.selectValue : styles.selectPlaceholder}>
                  {gender ? genderLabel(gender) : "请选择"}
                </span>
                <span className={styles.selectArrow}>▾</span>
              </button>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="birthday">生日</label>
              <input id="birthday" className={styles.input} type="date" value={birthday} onChange={e => setBirthday(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="school">学校/机构</label>
              <input id="school" className={styles.input} value={school} onChange={e => setSchool(e.target.value)} placeholder="填写你的所在学校或机构" />
            </div>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label} htmlFor="skills">擅长领域</label>
              <TagInput id="skills" value={skills} onChange={setSkills} placeholder="输入标签后按回车" />
            </div>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label} htmlFor="bio">个人简介</label>
              <textarea id="bio" className={styles.textarea} value={bio} onChange={e => setBio(e.target.value)} placeholder="介绍一下自己..." />
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          {saveMessage ? <span style={{ color: "var(--color-primary-strong)" }}>{saveMessage}</span> : null}
        </div>
      </form>
      {genderPickerOpen ? (
        <div className={styles.pickerOverlay} onClick={() => setGenderPickerOpen(false)}>
          <div className={styles.pickerDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.pickerTitle}>选择性别</div>
            <div className={styles.pickerOptions}>
              {GENDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.pickerOption} ${tempGender === opt.value ? styles.pickerOptionActive : ""}`}
                  onClick={() => setTempGender(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className={styles.pickerActions}>
              <button type="button" className={styles.pickerCancel} onClick={() => setGenderPickerOpen(false)}>
                取消
              </button>
              <button
                type="button"
                className={styles.pickerConfirm}
                onClick={() => {
                  setGender(tempGender);
                  setGenderPickerOpen(false);
                }}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {showSaveSuccess ? (
        <div className={styles.successOverlay}>
          <div className={styles.successDialog}>
            <div className={styles.successIcon}>✓</div>
            <div className={styles.successTitle}>保存成功</div>
            <div className={styles.successText}>你的资料已更新</div>
            <button type="button" className={styles.successButton} onClick={() => navigate("/profile")}>
              返回我的主页
            </button>
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
};

export default EditProfilePage;