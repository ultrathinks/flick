import { afterEach, describe, expect, it, vi } from "vitest";
import { openSse } from "./sse.ts";

function sseResponse(frames: string[], keepOpen = false): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const frame of frames) {
        controller.enqueue(encoder.encode(frame));
      }
      if (!keepOpen) {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
  });
}

function revokedResponse(): Response {
  return new Response(
    JSON.stringify({ error: { code: "KIOSK_REVOKED", message: "revoked" } }),
    { status: 403 },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("openSse", () => {
  it("parses and delivers enveloped events", async () => {
    const events: Array<{ type: string; data: unknown }> = [];
    const envelope = { v: 1, type: "balance.changed", data: { balance: 5000 } };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        sseResponse([`id: 1\ndata: ${JSON.stringify(envelope)}\n\n`], true),
      )
      .mockResolvedValue(sseResponse([], true));
    vi.stubGlobal("fetch", fetchMock);

    const handle = openSse({
      url: "/x",
      onEvent: (event) => events.push(event as { type: string; data: unknown }),
      random: () => 0,
    });
    await vi.waitFor(() => expect(events.length).toBeGreaterThan(0));
    handle.close();

    expect(events[0]?.data).toMatchObject({
      type: "balance.changed",
      data: { balance: 5000 },
    });
  });

  it("calls onRevoked and stops on a 403 kiosk_revoked", async () => {
    const fetchMock = vi.fn().mockResolvedValue(revokedResponse());
    vi.stubGlobal("fetch", fetchMock);
    const onRevoked = vi.fn();
    const statuses: string[] = [];

    const handle = openSse({
      url: "/x",
      onEvent: () => undefined,
      onRevoked,
      onStatus: (status) => statuses.push(status),
      random: () => 0,
    });
    await vi.waitFor(() => expect(onRevoked).toHaveBeenCalled());
    handle.close();

    expect(statuses).toContain("closed");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reconnects after the stream drops", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(sseResponse([]))
      .mockResolvedValue(sseResponse([], true));
    vi.stubGlobal("fetch", fetchMock);

    const handle = openSse({
      url: "/x",
      onEvent: () => undefined,
      baseDelayMs: 5,
      maxDelayMs: 10,
      random: () => 0,
    });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2), {
      timeout: 1000,
    });
    handle.close();
  });

  it("evaluates a headers getter on each connect", async () => {
    const seen: Array<Record<string, string> | undefined> = [];
    const fetchMock = vi.fn((_url: string, init: RequestInit) => {
      seen.push(init.headers as Record<string, string> | undefined);
      return Promise.resolve(sseResponse([], true));
    });
    vi.stubGlobal("fetch", fetchMock);

    let token = "first";
    const handle = openSse({
      url: "/x",
      headers: () => ({ Authorization: `Bearer ${token}` }),
      onEvent: () => undefined,
      random: () => 0,
    });
    await vi.waitFor(() => expect(seen.length).toBeGreaterThan(0));
    token = "second";
    handle.close();

    expect(seen[0]).toEqual({ Authorization: "Bearer first" });
  });
});
