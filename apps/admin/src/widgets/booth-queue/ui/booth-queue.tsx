"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { type Booth, type BoothStatus, useBooths } from "@/entities/booth";
import { useBoothModeration } from "@/features/booth-moderation";
import { useAdminEvents } from "@/shared/api/use-admin-events.ts";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Loader,
  QueryState,
  useConfirm,
  useToast,
} from "@/shared/ui";
import {
  BOOTH_STATUS_LABEL,
  BOOTH_STATUS_TONE,
  BOOTH_TABS,
} from "../model/labels.ts";

export function BoothQueue() {
  const [tab, setTab] = useState<BoothStatus | "all">("pending");
  const booths = useBooths();
  const moderation = useBoothModeration();
  const confirm = useConfirm();
  const toast = useToast();
  const queryClient = useQueryClient();

  useAdminEvents({
    onEvent: (event) => {
      if (
        event.type === "booth.created" ||
        event.type === "booth.approved" ||
        event.type === "booth.rejected"
      ) {
        queryClient.invalidateQueries({ queryKey: ["booths"] });
      }
    },
    onReconnect: () => {
      queryClient.invalidateQueries({ queryKey: ["booths"] });
    },
  });

  const filtered = useMemo(() => {
    const all = booths.data ?? [];
    return tab === "all" ? all : all.filter((booth) => booth.status === tab);
  }, [booths.data, tab]);

  function approve(booth: Booth) {
    moderation.mutate(
      { boothId: booth.id, action: "approve" },
      { onSuccess: () => toast.success("부스를 승인했어요") },
    );
  }

  async function reject(booth: Booth) {
    const ok = await confirm({
      title: "부스를 거절할까요?",
      description: `"${booth.name}" 부스 신청을 거절해요.`,
      confirmLabel: "거절",
      tone: "danger",
    });
    if (!ok) {
      return;
    }
    moderation.mutate(
      { boothId: booth.id, action: "reject" },
      { onSuccess: () => toast.success("부스를 거절했어요") },
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1">
        {BOOTH_TABS.map((item) => (
          <Button
            key={item.value}
            size="sm"
            variant={tab === item.value ? "fill" : "neutral"}
            onClick={() => setTab(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <QueryState
        isPending={booths.isPending}
        isError={booths.isError}
        isEmpty={filtered.length === 0}
        onRetry={() => booths.refetch()}
        loading={
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        }
        empty={<EmptyState title="해당하는 부스가 없어요" />}
      >
        <div className="flex flex-col gap-2">
          {filtered.map((booth) => (
            <BoothRow
              key={booth.id}
              booth={booth}
              pending={
                moderation.isPending &&
                moderation.variables?.boothId === booth.id
              }
              onApprove={() => approve(booth)}
              onReject={() => reject(booth)}
            />
          ))}
        </div>
      </QueryState>
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
    <Card className="flex items-center justify-between gap-2 px-4 py-3">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-body font-medium text-foreground">
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
        <div className="flex shrink-0 gap-2">
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
    </Card>
  );
}
