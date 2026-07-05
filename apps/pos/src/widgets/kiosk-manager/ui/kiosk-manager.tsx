"use client";

import { KeyRound, Monitor, Plus } from "lucide-react";
import { useState } from "react";
import type { Booth } from "@/entities/booth";
import {
  type CreatePairingResult,
  type KioskPairing,
  useCreateKioskPairing,
  useKioskPairings,
} from "@/entities/kiosk";
import { Badge, Button, EmptyState, Field, Sheet, Skeleton } from "@/shared/ui";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PairingRow({ pairing }: { pairing: KioskPairing }) {
  const claimed = pairing.claimedAt !== null;
  const expired = !claimed && new Date(pairing.expiresAt) < new Date();
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-surface px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <Monitor className="size-4 shrink-0 text-foreground-subtle" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {pairing.kioskName}
          </p>
          <p className="text-xs text-foreground-subtle">
            {claimed
              ? `연결됨 · ${formatDate(pairing.claimedAt as string)}`
              : `만료 ${formatDate(pairing.expiresAt)}`}
          </p>
        </div>
      </div>
      <Badge tone={claimed ? "success" : expired ? "neutral" : "warning"}>
        {claimed ? "연결됨" : expired ? "만료" : "대기"}
      </Badge>
    </div>
  );
}

function CreateSheet({
  boothId,
  open,
  onClose,
  onCreated,
}: {
  boothId: string;
  open: boolean;
  onClose: () => void;
  onCreated: (result: CreatePairingResult) => void;
}) {
  const [name, setName] = useState("");
  const create = useCreateKioskPairing(boothId);

  return (
    <Sheet open={open} onClose={onClose} title="키오스크 추가">
      <div className="space-y-4">
        <Field
          label="키오스크 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 1번 단말"
        />
        <Button
          className="w-full"
          disabled={!name.trim() || create.isPending}
          onClick={() =>
            create.mutate(name.trim(), {
              onSuccess: (result) => {
                setName("");
                onCreated(result);
              },
            })
          }
        >
          <KeyRound className="size-4" />
          {create.isPending ? "생성 중…" : "페어링 코드 생성"}
        </Button>
        {create.isError && (
          <p className="text-sm text-danger">생성에 실패했어요.</p>
        )}
      </div>
    </Sheet>
  );
}

function CodeSheet({
  result,
  onClose,
}: {
  result: CreatePairingResult | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={result !== null} onClose={onClose} title="페어링 코드">
      {result && (
        <div className="space-y-4">
          <p className="text-sm text-foreground-subtle">
            키오스크 기기에서 아래 코드를 입력해 연결하세요. 이 코드는 지금만
            확인할 수 있어요.
          </p>
          <div className="rounded-[var(--radius-card)] border border-border bg-surface-muted py-6 text-center">
            <p className="text-3xl font-semibold tracking-[0.3em] tabular-nums text-foreground">
              {result.code}
            </p>
          </div>
          <Button className="w-full" onClick={onClose}>
            확인
          </Button>
        </div>
      )}
    </Sheet>
  );
}

export function KioskManager({ booth }: { booth: Booth }) {
  const pairings = useKioskPairings(booth.id);
  const [createOpen, setCreateOpen] = useState(false);
  const [created, setCreated] = useState<CreatePairingResult | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            키오스크
          </h1>
          {pairings.data && pairings.data.length > 0 && (
            <span className="text-sm text-foreground-subtle">
              {pairings.data.length}
            </span>
          )}
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          키오스크 추가
        </Button>
      </div>

      {pairings.isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : pairings.data && pairings.data.length > 0 ? (
        <div className="space-y-2">
          {pairings.data.map((pairing) => (
            <PairingRow key={pairing.id} pairing={pairing} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Monitor />}
          title="연결된 키오스크가 없어요"
          description="키오스크를 추가해 페어링 코드를 발급하세요."
        />
      )}

      <CreateSheet
        boothId={booth.id}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(result) => {
          setCreateOpen(false);
          setCreated(result);
        }}
      />
      <CodeSheet result={created} onClose={() => setCreated(null)} />
    </div>
  );
}
