import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.ts";
import {
  closeEvents,
  publishBoothEvent,
  subscribeBoothEvents,
} from "../src/lib/events.ts";
import { closeRedis } from "../src/lib/redis.ts";
import {
  authHeaders,
  createBoothWithKiosk,
  createOrderWithPayment,
  createProduct,
  createUser,
  kioskHeaders,
  resetDb,
} from "./helpers.ts";

function waitFor<T>(fn: () => T | undefined, timeoutMs = 2000): Promise<T> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      const value = fn();
      if (value !== undefined) {
        resolve(value);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error("timed out waiting for condition"));
        return;
      }
      setTimeout(tick, 20);
    };
    tick();
  });
}

async function readFirstEvent(res: Response): Promise<string> {
  const reader = (res.body as ReadableStream<Uint8Array>).getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const match = buffer.match(/data: (.+)\n\n/);
    if (match) {
      await reader.cancel();
      return buffer;
    }
  }
  return buffer;
}

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeEvents();
  await closeRedis();
});

describe("event bus", () => {
  it("delivers published events to subscribers of the same booth", async () => {
    const received: string[] = [];
    const unsub = subscribeBoothEvents("booth-x", (event) => {
      received.push(event.type);
    });
    await new Promise((r) => setTimeout(r, 150));
    await publishBoothEvent("booth-x", {
      type: "product.updated",
      productId: "p1",
    });
    await waitFor(() => (received.length > 0 ? received : undefined));
    unsub();
    expect(received).toContain("product.updated");
  });

  it("does not deliver events across different booths", async () => {
    const received: string[] = [];
    const unsub = subscribeBoothEvents("booth-a", (event) => {
      received.push(event.type);
    });
    await publishBoothEvent("booth-b", {
      type: "product.updated",
      productId: "p1",
    });
    await new Promise((r) => setTimeout(r, 200));
    unsub();
    expect(received).toHaveLength(0);
  });
});

describe("booth SSE stream", () => {
  it("streams payment completion to the booth owner", async () => {
    const owner = await createUser();
    const buyer = await createUser({ balance: 5000 });
    const { boothId, kioskId } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId, { price: 1000 });
    const { code } = await createOrderWithPayment(boothId, kioskId, productId, {
      price: 1000,
    });

    const streamRes = await app.request(`/v1/booths/${boothId}/events`, {
      headers: authHeaders(owner.accessToken),
    });
    expect(streamRes.status).toBe(200);
    expect(streamRes.headers.get("content-type")).toContain(
      "text/event-stream",
    );

    const eventPromise = readFirstEvent(streamRes);

    await new Promise((r) => setTimeout(r, 100));
    const confirmRes = await app.request(`/v1/payment-codes/${code}/confirm`, {
      method: "POST",
      headers: authHeaders(buyer.accessToken),
    });
    expect(confirmRes.status).toBe(200);

    const payload = await eventPromise;
    expect(payload).toContain("payment.completed");
  });

  it("rejects non-owners", async () => {
    const owner = await createUser();
    const stranger = await createUser();
    const { boothId } = await createBoothWithKiosk(owner.id);
    const res = await app.request(`/v1/booths/${boothId}/events`, {
      headers: authHeaders(stranger.accessToken),
    });
    expect(res.status).toBe(403);
  });
});

describe("kiosk presence", () => {
  it("publishes presence and updates last_seen_at on heartbeat", async () => {
    const owner = await createUser();
    const { boothId, deviceToken } = await createBoothWithKiosk(owner.id);

    const received: boolean[] = [];
    const unsub = subscribeBoothEvents(boothId, (event) => {
      if (event.type === "kiosk.presence") {
        received.push(event.online);
      }
    });
    await new Promise((r) => setTimeout(r, 150));

    const res = await app.request("/v1/kiosks/me/heartbeat", {
      method: "POST",
      headers: kioskHeaders(deviceToken),
    });
    expect(res.status).toBe(204);

    await waitFor(() => (received.length > 0 ? received : undefined));
    unsub();
    expect(received).toContain(true);

    const meRes = await app.request("/v1/kiosks/me", {
      headers: kioskHeaders(deviceToken),
    });
    const body = (await meRes.json()) as {
      kiosk: { lastSeenAt: string | null };
    };
    expect(body.kiosk.lastSeenAt).not.toBeNull();
  });
});

describe("booth kiosks list", () => {
  it("returns claimed devices and pending pairings", async () => {
    const owner = await createUser();
    const { boothId, kioskId } = await createBoothWithKiosk(owner.id);

    const createRes = await app.request(`/v1/booths/${boothId}/kiosks`, {
      method: "POST",
      headers: authHeaders(owner.accessToken),
      body: JSON.stringify({ name: "Pending Kiosk" }),
    });
    expect(createRes.status).toBe(201);

    const listRes = await app.request(`/v1/booths/${boothId}/kiosks`, {
      headers: authHeaders(owner.accessToken),
    });
    expect(listRes.status).toBe(200);
    const body = (await listRes.json()) as {
      devices: Array<{ id: string; lastSeenAt: string | null }>;
      pending: Array<{ kioskName: string }>;
    };
    expect(body.devices.map((d) => d.id)).toContain(kioskId);
    expect(body.pending.map((p) => p.kioskName)).toContain("Pending Kiosk");
  });

  it("drops revoked devices and publishes revoke", async () => {
    const owner = await createUser();
    const { boothId, kioskId } = await createBoothWithKiosk(owner.id);

    const events: string[] = [];
    const unsub = subscribeBoothEvents(boothId, (event) => {
      events.push(event.type);
    });
    await new Promise((r) => setTimeout(r, 150));

    const revokeRes = await app.request(`/v1/kiosks/${kioskId}/revoke`, {
      method: "POST",
      headers: authHeaders(owner.accessToken),
    });
    expect(revokeRes.status).toBe(200);

    await waitFor(() =>
      events.includes("kiosk.revoked") ? events : undefined,
    );
    unsub();

    const listRes = await app.request(`/v1/booths/${boothId}/kiosks`, {
      headers: authHeaders(owner.accessToken),
    });
    const body = (await listRes.json()) as {
      devices: Array<{ id: string }>;
    };
    expect(body.devices.map((d) => d.id)).not.toContain(kioskId);
  });
});
