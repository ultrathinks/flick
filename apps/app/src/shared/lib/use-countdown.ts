import { useEffect, useState } from "react";

export function useCountdown(targetTime: number | null): number {
  const [remaining, setRemaining] = useState(() =>
    targetTime ? Math.max(0, targetTime - Date.now()) : 0,
  );

  useEffect(() => {
    if (!targetTime) {
      setRemaining(0);
      return;
    }
    const tick = () => {
      setRemaining(Math.max(0, targetTime - Date.now()));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [targetTime]);

  return remaining;
}

export function formatSeconds(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
