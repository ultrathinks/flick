"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "../lib/cn";

type ToastTone = "success" | "danger" | "neutral";

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneDot: Record<ToastTone, string> = {
  success: "bg-success",
  danger: "bg-danger",
  neutral: "bg-foreground-subtle",
};

export function ToastProvider({
  children,
  duration = 3500,
}: {
  children: React.ReactNode;
  duration?: number;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: ToastTone = "neutral") => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, tone }]);
      window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss, duration],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message) => show(message, "success"),
      error: (message) => show(message, "danger"),
      info: (message) => show(message, "neutral"),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-6 z-[60] flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            onClick={() => dismiss(toast.id)}
            className="pointer-events-auto flex max-w-md animate-toast-in items-center gap-2.5 rounded-card border border-border bg-surface px-5 py-3.5 text-left text-body font-medium text-foreground shadow-[var(--shadow-overlay)] outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                toneDot[toast.tone],
              )}
            />
            <span>{toast.message}</span>
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
