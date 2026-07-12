"use client";

import { useQueryClient } from "@tanstack/react-query";
import { KeyRound, Monitor, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Booth } from "@/entities/booth";
import {
  type CreatePairingResult,
  isKioskOnline,
  type KioskDevice,
  type KioskPairing,
  useBoothKiosks,
  useCreateKioskPairing,
  useRevokeKiosk,
} from "@/entities/kiosk";
import { useBoothEvents } from "@/shared/api/use-booth-events.ts";
import {
  Badge,
  Button,
  CodeDisplay,
  EmptyState,
  Field,
  Menu,
  MenuItem,
  QueryState,
  Sheet,
  Skeleton,
  useConfirm,
  useToast,
} from "@/shared/ui";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DeviceRow({
  device,
  onRevoke,
}: {
  device: KioskDevice;
  onRevoke: (device: KioskDevice) => void;
}) {
  const online = isKioskOnline(device);
  return (
    <div className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <Monitor className="size-4 shrink-0 text-foreground-subtle" />
        <div className="min-w-0">
          <p className="truncate text-body font-medium text-foreground">
            {device.name}
          </p>
          <p className="text-caption text-foreground-subtle">
            {device.lastSeenAt
              ? `마지막 연결 ${formatDate(device.lastSeenAt)}`
              : "아직 연결된 적 없음"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge tone={online ? "success" : "neutral"}>
          {online ? "연결됨" : "연결 끊김"}
        </Badge>
        <Menu
          trigger={({ toggle, triggerProps }) => (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="더보기"
              onClick={toggle}
              {...triggerProps}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        >
          <MenuItem
            tone="danger"
            icon={<Trash2 />}
            onClick={() => onRevoke(device)}
          >
            연결 해제
          </MenuItem>
        </Menu>
      </div>
    </div>
  );
}

function PendingRow({ pairing }: { pairing: KioskPairing }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-card border border-dashed border-border bg-surface px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <Monitor className="size-4 shrink-0 text-foreground-subtle" />
        <div className="min-w-0">
          <p className="truncate text-body font-medium text-foreground">
            {pairing.kioskName}
          </p>
          <p className="text-caption text-foreground-subtle">
            코드 만료 {formatDate(pairing.expiresAt)}
          </p>
        </div>
      </div>
      <Badge tone="warning">대기</Badge>
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
          loading={create.isPending}
          disabled={!name.trim()}
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
          페어링 코드 생성
        </Button>
        {create.isError && (
          <p className="text-body text-danger">생성에 실패했어요.</p>
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
          <p className="text-body text-foreground-subtle">
            키오스크 기기에서 아래 코드를 입력해 연결하세요. 이 코드는 지금만
            확인할 수 있어요.
          </p>
          <CodeDisplay code={result.code} size="lg" />
          <Button className="w-full" onClick={onClose}>
            확인
          </Button>
        </div>
      )}
    </Sheet>
  );
}

export function KioskManager({
  booth,
  createOpen,
  onCreateOpenChange,
}: {
  booth: Booth;
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}) {
  const kiosks = useBoothKiosks(booth.id);
  const revoke = useRevokeKiosk(booth.id);
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [created, setCreated] = useState<CreatePairingResult | null>(null);
  const toast = useToast();

  useBoothEvents(booth.id, {
    onEvent: (event) => {
      if (
        event.type === "kiosk.presence" ||
        event.type === "kiosk.revoked" ||
        event.type === "kiosk.paired"
      ) {
        queryClient.invalidateQueries({ queryKey: ["kiosks", booth.id] });
      }
    },
    onReconnect: () => {
      queryClient.invalidateQueries({ queryKey: ["kiosks", booth.id] });
    },
  });

  useEffect(() => {
    const timer = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["kiosks", booth.id] });
    }, 30_000);
    return () => clearInterval(timer);
  }, [booth.id, queryClient]);

  const handleRevoke = async (device: KioskDevice) => {
    const ok = await confirm({
      title: "이 키오스크 연결을 해제할까요?",
      description: `‘${device.name}’ 기기는 다시 페어링해야 사용할 수 있어요.`,
      confirmLabel: "연결 해제",
      tone: "danger",
    });
    if (!ok) return;
    revoke.mutate(device.id, {
      onSuccess: () => toast.success("연결을 해제했어요."),
      onError: () => toast.error("연결 해제에 실패했어요."),
    });
  };

  const devices = kiosks.data?.devices ?? [];
  const pending = kiosks.data?.pending ?? [];
  const isEmpty = devices.length === 0 && pending.length === 0;

  return (
    <div className="space-y-6">
      <QueryState
        isPending={kiosks.isPending}
        isError={kiosks.isError}
        isEmpty={isEmpty}
        onRetry={() => kiosks.refetch()}
        loading={
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        }
        empty={
          <EmptyState
            icon={<Monitor />}
            title="연결된 키오스크가 없어요"
            description="키오스크를 추가해 페어링 코드를 발급하세요."
          />
        }
      >
        <div className="space-y-2">
          {devices.map((device) => (
            <DeviceRow
              key={device.id}
              device={device}
              onRevoke={handleRevoke}
            />
          ))}
          {pending.map((pairing) => (
            <PendingRow key={pairing.id} pairing={pairing} />
          ))}
        </div>
      </QueryState>

      <CreateSheet
        boothId={booth.id}
        open={createOpen}
        onClose={() => onCreateOpenChange(false)}
        onCreated={(result) => {
          onCreateOpenChange(false);
          setCreated(result);
          toast.success("키오스크 코드를 만들었어요");
        }}
      />
      <CodeSheet result={created} onClose={() => setCreated(null)} />
    </div>
  );
}
