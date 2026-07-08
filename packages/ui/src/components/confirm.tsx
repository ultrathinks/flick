"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Button } from "./button";
import { Sheet } from "./sheet";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "brand" | "danger";
}

type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback<ConfirmContextValue>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  const settle = useCallback(
    (value: boolean) => {
      pending?.resolve(value);
      setPending(null);
    },
    [pending],
  );

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Sheet
        open={pending !== null}
        onClose={() => settle(false)}
        title={pending?.title}
      >
        <div className="space-y-5">
          {pending?.description ? (
            <p className="text-body text-foreground-muted">
              {pending.description}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button
              variant="neutral"
              size="lg"
              block
              onClick={() => settle(false)}
            >
              {pending?.cancelLabel ?? "취소"}
            </Button>
            <Button
              variant={pending?.tone === "danger" ? "danger" : "fill"}
              size="lg"
              block
              onClick={() => settle(true)}
            >
              {pending?.confirmLabel ?? "확인"}
            </Button>
          </div>
        </div>
      </Sheet>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return ctx;
}
