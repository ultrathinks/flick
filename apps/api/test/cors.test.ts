import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.ts";
import { closeRedis } from "../src/lib/redis.ts";
import {
  createBoothWithKiosk,
  createOrderWithPayment,
  createProduct,
  createUser,
  resetDb,
} from "./helpers.ts";

const ALLOWED_ORIGIN = "http://localhost:3001";
const DISALLOWED_ORIGIN = "http://evil.example.com";

beforeAll(() => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set for integration tests");
  }
  process.env.CORS_ORIGIN = `${ALLOWED_ORIGIN},http://localhost:3002`;
});

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeRedis();
});

describe("cors", () => {
  it("answers preflight for an allowed origin", async () => {
    const res = await app.request("/v1/kiosks/pair", {
      method: "OPTIONS",
      headers: {
        Origin: ALLOWED_ORIGIN,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,content-type",
      },
    });

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ALLOWED_ORIGIN);
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    const allowHeaders =
      res.headers.get("Access-Control-Allow-Headers")?.toLowerCase() ?? "";
    expect(allowHeaders).toContain("authorization");
    expect(allowHeaders).toContain("content-type");
  });

  it("omits allow-origin for a disallowed origin", async () => {
    const res = await app.request("/v1/kiosks/pair", {
      method: "OPTIONS",
      headers: {
        Origin: DISALLOWED_ORIGIN,
        "Access-Control-Request-Method": "POST",
      },
    });

    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("adds allow-origin to a normal json response", async () => {
    const res = await app.request("/health", {
      headers: { Origin: ALLOWED_ORIGIN },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ALLOWED_ORIGIN);
  });

  it("adds allow-origin to the streaming SSE response", async () => {
    const user = await createUser();
    const { boothId, kioskId, deviceToken } = await createBoothWithKiosk(
      user.id,
    );
    const product = await createProduct(boothId);
    const { paymentId } = await createOrderWithPayment(
      boothId,
      kioskId,
      product,
    );

    const controller = new AbortController();
    const res = await app.request(`/v1/payments/${paymentId}/events`, {
      headers: {
        Origin: ALLOWED_ORIGIN,
        Authorization: `Bearer ${deviceToken}`,
      },
      signal: controller.signal,
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ALLOWED_ORIGIN);

    controller.abort();
    await res.body?.cancel().catch(() => {});
  });
});
