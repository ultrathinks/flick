import type { Booth } from "@/entities/booth";

const LABELS: Record<Booth["status"], { text: string; className: string }> = {
  draft: {
    text: "작성 중입니다.",
    className: "bg-zinc-100 text-zinc-600",
  },
  pending: {
    text: "관리자 승인을 기다리는 중입니다. 승인 후 판매를 시작할 수 있어요.",
    className: "bg-amber-50 text-amber-700",
  },
  approved: {
    text: "승인되었습니다. 판매를 시작할 수 있어요.",
    className: "bg-emerald-50 text-emerald-700",
  },
  rejected: {
    text: "승인이 반려되었습니다. 부스 정보를 확인해 주세요.",
    className: "bg-red-50 text-red-700",
  },
};

export function BoothStatusBanner({ status }: { status: Booth["status"] }) {
  const label = LABELS[status];
  return (
    <div
      className={`rounded-lg px-4 py-3 text-sm font-medium ${label.className}`}
    >
      {label.text}
    </div>
  );
}
