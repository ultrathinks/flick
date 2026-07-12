import { useEffect, useRef } from "react";

export function useIdleTimeout(timeoutMs: number, onIdle: () => void): void {
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        onIdleRef.current();
      }, timeoutMs);
    };

    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown"];
    for (const event of events) {
      window.addEventListener(event, reset);
    }
    reset();

    return () => {
      clearTimeout(timer);
      for (const event of events) {
        window.removeEventListener(event, reset);
      }
    };
  }, [timeoutMs]);
}
