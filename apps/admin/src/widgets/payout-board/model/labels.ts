import type { PayoutStatus } from "@/entities/payout";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger";

export const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  requested: "요청됨",
  paid: "지급됨",
  rejected: "거절됨",
};

export const PAYOUT_STATUS_TONE: Record<PayoutStatus, Tone> = {
  requested: "warning",
  paid: "success",
  rejected: "danger",
};

export const PAYOUT_TABS: { value: PayoutStatus | ""; label: string }[] = [
  { value: "requested", label: "요청됨" },
  { value: "paid", label: "지급됨" },
  { value: "rejected", label: "거절됨" },
  { value: "", label: "전체" },
];
