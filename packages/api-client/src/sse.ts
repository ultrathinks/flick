import { isApiErrorBody } from "./errors.ts";

export type SseStatus = "connecting" | "open" | "reconnecting" | "closed";

export interface SseEvent {
  type: string;
  data: unknown;
}

export type SseHeaders =
  | Record<string, string>
  | (() => Record<string, string> | undefined);

export interface OpenSseOptions {
  url: string;
  headers?: SseHeaders;
  onEvent: (event: SseEvent) => void;
  onOpen?: () => void;
  onStatus?: (status: SseStatus) => void;
  onRevoked?: () => void;
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  random?: () => number;
}

export interface SseHandle {
  close(): void;
}

const DEFAULT_MAX_RETRIES = 30;
const DEFAULT_BASE_DELAY_MS = 1000;
const DEFAULT_MAX_DELAY_MS = 15000;

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export function openSse(options: OpenSseOptions): SseHandle {
  const {
    url,
    headers,
    onEvent,
    onOpen,
    onStatus,
    onRevoked,
    maxRetries = DEFAULT_MAX_RETRIES,
    baseDelayMs = DEFAULT_BASE_DELAY_MS,
    maxDelayMs = DEFAULT_MAX_DELAY_MS,
    random = Math.random,
  } = options;

  const controller = new AbortController();
  let retries = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  function setStatus(status: SseStatus): void {
    onStatus?.(status);
  }

  function delayFor(attempt: number): number {
    const capped = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
    return capped * (0.5 + random() * 0.5);
  }

  function scheduleReconnect(): void {
    if (closed || controller.signal.aborted) {
      return;
    }
    if (retries >= maxRetries) {
      setStatus("closed");
      return;
    }
    const delay = delayFor(retries);
    retries += 1;
    setStatus("reconnecting");
    reconnectTimer = setTimeout(connect, delay);
  }

  async function isRevoked(response: Response): Promise<boolean> {
    if (response.status !== 403) {
      return false;
    }
    const body = await response.json().catch(() => null);
    if (isApiErrorBody(body) && body.error.code === "KIOSK_REVOKED") {
      closed = true;
      setStatus("closed");
      onRevoked?.();
      return true;
    }
    return false;
  }

  async function readStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
  ): Promise<void> {
    const decoder = new TextDecoder();
    let buffer = "";
    let eventName = "";
    let data = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done || closed || controller.signal.aborted) {
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith(":")) {
          continue;
        }
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          const chunk = line.slice(5).trimStart();
          data = data ? `${data}\n${chunk}` : chunk;
        } else if (line === "") {
          const parsed = data ? parseJson(data) : undefined;
          if (parsed !== undefined) {
            onEvent({ type: eventName || "message", data: parsed });
          }
          eventName = "";
          data = "";
        }
      }
    }
  }

  async function connect(): Promise<void> {
    if (closed || controller.signal.aborted) {
      return;
    }
    setStatus("connecting");
    try {
      const resolvedHeaders =
        typeof headers === "function" ? headers() : headers;
      const response = await fetch(url, {
        headers: resolvedHeaders,
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        if (await isRevoked(response)) {
          return;
        }
        scheduleReconnect();
        return;
      }
      if (closed || controller.signal.aborted) {
        return;
      }
      setStatus("open");
      retries = 0;
      onOpen?.();
      await readStream(response.body.getReader());
      scheduleReconnect();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      scheduleReconnect();
    }
  }

  connect();

  return {
    close(): void {
      closed = true;
      controller.abort();
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    },
  };
}
