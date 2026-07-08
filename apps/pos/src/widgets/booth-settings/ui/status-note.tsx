import type { Booth } from "@/entities/booth";

const STATUS_NOTE: Record<
  Booth["status"],
  { text: string; tone: "neutral" | "warning" | "success" | "danger" }
> = {
  draft: {
    text: "작성 중입니다. 부스를 제출하면 관리자 승인을 받아요.",
    tone: "neutral",
  },
  pending: {
    text: "관리자 승인을 기다리는 중입니다. 승인 후 판매를 시작할 수 있어요.",
    tone: "warning",
  },
  approved: {
    text: "승인되었습니다. 판매와 키오스크 연결을 시작할 수 있어요.",
    tone: "success",
  },
  rejected: {
    text: "승인이 반려되었습니다. 부스 정보를 확인하고 다시 시도해 주세요.",
    tone: "danger",
  },
};

const TONE_CLASS: Record<string, string> = {
  neutral: "bg-surface-muted text-foreground-subtle",
  warning: "bg-warning-subtle text-warning",
  success: "bg-success-subtle text-success",
  danger: "bg-danger-subtle text-danger",
};

export function StatusNote({ status }: { status: Booth["status"] }) {
  const note = STATUS_NOTE[status];
  return (
    <div
      className={`rounded-card px-3.5 py-2.5 text-caption ${TONE_CLASS[note.tone]}`}
    >
      {note.text}
    </div>
  );
}
