export type Gender = "MALE" | "FEMALE" | "OTHER" | "UNKNOWN";

export type ProfileUpdateRequest = {
  nickname?: string;
  nicknameDecor?: string;
  bio?: string;
  zgId?: string;
  gender?: Gender;
  birthday?: string; // ISO 日期或 yyyy-MM-dd 字符串
  school?: string;
  email?: string;
  phone?: string;
  tagJson?: string; // 字符串化的标签数组，例如 "[\"Java\",\"后端\"]"
};

export type ProfileResponse = {
  id: number;
  nickname: string;
  nicknameDecor?: string;
  avatar: string;
  bio?: string;
  zgId?: string;
  gender?: Gender;
  birthday?: string;
  school?: string;
  email?: string;
  phone?: string;
  tagJson?: string;
};