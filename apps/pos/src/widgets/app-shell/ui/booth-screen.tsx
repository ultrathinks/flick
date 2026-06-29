"use client";

import { Lock } from "lucide-react";
import { useEffect } from "react";
import type { Booth } from "@/entities/booth";
import { useMyBooth } from "@/entities/booth";
import { ApiError } from "@/shared/api";
import { EmptyState, Skeleton } from "@/shared/ui";
import { BoothOnboarding } from "@/widgets/booth-onboarding";
import { isTabLocked, type TabKey } from "../model/tabs.ts";
import { AppShell } from "./app-shell.tsx";

export function BoothScreen({
  tab,
  children,
}: {
  tab: TabKey;
  children: (booth: Booth) => React.ReactNode;
}) {
  const booth = useMyBooth();

  useEffect(() => {
    if (booth.error instanceof ApiError && booth.error.status === 401) {
      window.location.href = "/api/auth/login";
    }
  }, [booth.error]);

  if (booth.isPending) {
    return (
      <div className="min-h-screen bg-background px-5 py-6">
        <div className="mx-auto w-full max-w-5xl">
          <Skeleton className="h-8 w-40" />
          <div className="mt-6 space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!booth.data) {
    return <BoothOnboarding />;
  }

  const data = booth.data;
  const locked = isTabLocked(tab, data.status);

  return (
    <AppShell booth={data}>
      {locked ? (
        <EmptyState
          icon={<Lock />}
          title="아직 이용할 수 없어요"
          description="부스가 승인되면 키오스크를 연결할 수 있어요."
        />
      ) : (
        children(data)
      )}
    </AppShell>
  );
}
