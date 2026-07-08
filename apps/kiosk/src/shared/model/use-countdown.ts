import { useEffect, useRef, useState } from "react";

function remainingSecondsUntil(expiresAt: string | null) {
  if (!expiresAt) {
    return 0;
  }
  const target = Date.parse(expiresAt);
  if (Number.isNaN(target)) {
    return 0;
  }
  return Math.max(0, Math.ceil((target - Date.now()) / 1000));
}

export function useCountdown(expiresAt: string | null, onExpire?: () => void) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    remainingSecondsUntil(expiresAt),
  );
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!expiresAt) {
      setRemainingSeconds(0);
      return;
    }

    let expired = false;
    const tick = () => {
      const next = remainingSecondsUntil(expiresAt);
      setRemainingSeconds(next);
      if (next <= 0 && !expired) {
        expired = true;
        onExpireRef.current?.();
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  return remainingSeconds;
}
