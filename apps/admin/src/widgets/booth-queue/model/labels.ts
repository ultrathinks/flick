import type { BoothStatus } from "@/entities/booth";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger";

export const BOOTH_STATUS_LABEL: Record<BoothStatus, string> = {
  draft: "작성 중",
  pending: "승인 대기",
  approved: "승인됨",
  rejected: "거절됨",
};

export const BOOTH_STATUS_TONE: Record<BoothStatus, Tone> = {
  draft: "neutral",
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

export const BOOTH_TABS: { value: BoothStatus | "all"; label: string }[] = [
  { value: "pending", label: "승인 대기" },
  { value: "approved", label: "승인됨" },
  { value: "rejected", label: "거절됨" },
  { value: "all", label: "전체" },
];
