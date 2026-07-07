"use client";

import { useMemo, useState } from "react";
import { type Booth, type BoothStatus, useBooths } from "@/entities/booth";
import { useBoothModeration } from "@/features/booth-moderation";
import { Badge, Button, EmptyState, Loader } from "@/shared/ui";
import {
  BOOTH_STATUS_LABEL,
  BOOTH_STATUS_TONE,
  BOOTH_TABS,
} from "../model/labels.ts";

export function BoothQueue() {
  const [tab, setTab] = useState<BoothStatus | "all">("pending");
  const booths = useBooths();
  const moderation = useBoothModeration();

  const filtered = useMemo(() => {
    const all = booths.data ?? [];
    return tab === "all" ? all : all.filter((booth) => booth.status === tab);
  }, [booths.data, tab]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1">
        {BOOTH_TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setTab(item.value)}
            className={
              tab === item.value
                ? "rounded-full bg-brand px-3.5 py-1.5 text-caption font-semibold text-brand-foreground"
                : "rounded-full px-3.5 py-1.5 text-caption font-medium text-foreground-subtle transition-colors hover:bg-surface-muted"
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      {booths.isPending ? (
        <div className="flex justify-center py-20">
          <Loader />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="해당하는 부스가 없어요" />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((booth) => (
            <BoothRow
              key={booth.id}
              booth={booth}
              pending={
                moderation.isPending &&
                moderation.variables?.boothId === booth.id
              }
              onApprove={() =>
                moderation.mutate({ boothId: booth.id, action: "approve" })
              }
              onReject={() =>
                moderation.mutate({ boothId: booth.id, action: "reject" })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BoothRow({
  booth,
  pending,
  onApprove,
  onReject,
}: {
  booth: Booth;
  pending: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-card border border-border bg-surface px-4 py-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-body font-medium text-foreground">
            {booth.name}
          </span>
          <Badge tone={BOOTH_STATUS_TONE[booth.status]}>
            {BOOTH_STATUS_LABEL[booth.status]}
          </Badge>
        </div>
        {booth.description && (
          <p className="max-w-md truncate text-caption text-foreground-subtle">
            {booth.description}
          </p>
        )}
      </div>
      {booth.status === "pending" && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReject}
            disabled={pending}
          >
            거절
          </Button>
          <Button size="sm" onClick={onApprove} disabled={pending}>
            승인
          </Button>
        </div>
      )}
    </div>
  );
}
