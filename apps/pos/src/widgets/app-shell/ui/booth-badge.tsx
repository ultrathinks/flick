import type { Booth } from "@/entities/booth";
import { Badge } from "@/shared/ui";

const LABELS: Record<
  Booth["status"],
  { text: string; tone: "neutral" | "warning" | "success" | "danger" }
> = {
  draft: { text: "작성 중", tone: "neutral" },
  pending: { text: "승인 대기", tone: "warning" },
  approved: { text: "판매 중", tone: "success" },
  rejected: { text: "반려됨", tone: "danger" },
};

export function BoothBadge({ status }: { status: Booth["status"] }) {
  const label = LABELS[status];
  return <Badge tone={label.tone}>{label.text}</Badge>;
}
