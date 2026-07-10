import type { Context } from "hono";
import { type BoothEvent, subscribeBoothEvents } from "./events.ts";

const HEARTBEAT_MS = 20_000;
const MAX_LIFETIME_MS = 30 * 60 * 1000;

type BoothStreamOptions = {
  boothId: string;
  filter?: (event: BoothEvent) => boolean;
  onOpen?: () => void | Promise<void>;
  onClose?: () => void | Promise<void>;
  shouldClose?: (event: BoothEvent) => boolean;
};

export function boothEventStream(
  c: Context,
  options: BoothStreamOptions,
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      let unsubscribe: (() => void) | null = null;
      let heartbeat: ReturnType<typeof setInterval> | null = null;
      let maxLifetime: ReturnType<typeof setTimeout> | null = null;

      const close = () => {
        if (closed) {
          return;
        }
        closed = true;
        if (heartbeat) {
          clearInterval(heartbeat);
        }
        if (maxLifetime) {
          clearTimeout(maxLifetime);
        }
        unsubscribe?.();
        c.req.raw.signal.removeEventListener("abort", close);
        void options.onClose?.();
        try {
          controller.close();
        } catch {}
      };

      const enqueue = (chunk: string) => {
        if (closed) {
          return;
        }
        try {
          controller.enqueue(encoder.encode(chunk));
          if (controller.desiredSize !== null && controller.desiredSize < -16) {
            close();
          }
        } catch {
          close();
        }
      };

      enqueue("retry: 3000\n\n");
      enqueue(": connected\n\n");

      unsubscribe = subscribeBoothEvents(options.boothId, (event) => {
        if (options.filter && !options.filter(event)) {
          return;
        }
        enqueue(`data: ${JSON.stringify(event)}\n\n`);
        if (options.shouldClose?.(event)) {
          close();
        }
      });

      heartbeat = setInterval(() => enqueue(": ping\n\n"), HEARTBEAT_MS);
      maxLifetime = setTimeout(close, MAX_LIFETIME_MS);

      c.req.raw.signal.addEventListener("abort", close);
      void options.onOpen?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
