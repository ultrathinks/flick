"use client";

import { useEffect } from "react";
import { useSessionStatus } from "@/entities/session";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const session = useSessionStatus();

  useEffect(() => {
    if (session.isSuccess && !session.data) {
      window.location.href = "/api/auth/login";
    }
  }, [session.isSuccess, session.data]);

  if (session.isPending || !session.data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-400">
        불러오는 중…
      </div>
    );
  }

  return <>{children}</>;
}
