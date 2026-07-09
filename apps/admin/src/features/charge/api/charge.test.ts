import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/mocks/server.ts";
import { ApiError } from "@/shared/api";
import { createCharge, resolveUserCode } from "./charge.ts";

describe("charge api", () => {
  it("resolves a user code to a masked user", async () => {
    const resolved = await resolveUserCode("VALID-CODE");

    expect(resolved.userId).toBe("user-1");
    expect(resolved.balance).toBe(128000);
  });

  it("creates a charge with the requested amount", async () => {
    const charge = await createCharge({
      userId: "user-1",
      amount: 30000,
      idempotencyKey: "key-1",
    });

    expect(charge.amount).toBe(30000);
    expect(charge.createdAt).toBeInstanceOf(Date);
  });

  it("maps a not-found code to ApiError", async () => {
    server.use(
      http.post("/api/proxy/user-codes/resolve", () =>
        HttpResponse.json(
          { error: { code: "NOT_FOUND", message: "code not found" } },
          { status: 404 },
        ),
      ),
    );

    await expect(resolveUserCode("INVALID")).rejects.toBeInstanceOf(ApiError);
  });
});
