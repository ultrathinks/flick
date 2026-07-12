import type { ChannelEvent } from "@flick/contract";
import type { Context } from "hono";

const HEARTBEAT_MS = 20_000;
const MAX_LIFETIME_MS = 30 * 60 * 1000;
const LIFETIME_JITTER_MS = 5 * 60 * 1000;

type ChannelStreamOptions<E extends ChannelEvent> = {
  subscribe: (handler: (event: E) => void) => () => void;
  filter?: (event: E) => boolean;
  onOpen?: () => void | Promise<void>;
  onClose?: () => void | Promise<void>;
  shouldClose?: (event: E) => boolean;
};

export function channelEventStream<E extends ChannelEvent>(
  c: Context,
  options: ChannelStreamOptions<E>,
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
        void Promise.resolve(options.onClose?.()).catch(() => undefined);
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

      unsubscribe = options.subscribe((event) => {
        if (options.filter && !options.filter(event)) {
          return;
        }
        enqueue(`id: ${event.id}\ndata: ${JSON.stringify(event)}\n\n`);
        if (options.shouldClose?.(event)) {
          close();
        }
      });

      heartbeat = setInterval(() => enqueue(": ping\n\n"), HEARTBEAT_MS);
      maxLifetime = setTimeout(
        close,
        MAX_LIFETIME_MS + Math.floor(Math.random() * LIFETIME_JITTER_MS),
      );

      c.req.raw.signal.addEventListener("abort", close);
      void Promise.resolve(options.onOpen?.()).catch(() => undefined);
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
