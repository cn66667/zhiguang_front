export type NicknameDecor = "none" | "rainbow" | "gold" | "red";

export const DECOR_OPTIONS: { value: NicknameDecor; label: string }[] = [
  { value: "none", label: "无装饰" },
  { value: "rainbow", label: "彩虹流动" },
  { value: "gold", label: "金色" },
  { value: "red", label: "红色" }
];

const DECOR_CLASS: Record<NicknameDecor, string> = {
  none: "",
  rainbow: "nickname-decor-rainbow",
  gold: "nickname-decor-gold",
  red: "nickname-decor-red"
};

export const nicknameDecorClass = (decor?: string | null): string => {
  if (!decor || decor === "none") return "";
  return DECOR_CLASS[decor as NicknameDecor] ?? "";
};
