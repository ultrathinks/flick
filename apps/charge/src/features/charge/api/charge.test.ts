import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api";
import { createCharge, resolveUserCode } from "./charge.ts";

describe("charge api", () => {
  it("resolves a user code to a user", async () => {
    const resolved = await resolveUserCode("482913");

    expect(resolved.userId).toBe("user-1");
    expect(resolved.balance).toBe(128000);
  });

  it("creates a charge with the requested amount", async () => {
    const charge = await createCharge({
      userId: "user-1",
      amount: 3000,
      idempotencyKey: "key-1",
    });

    expect(charge.amount).toBe(3000);
    expect(charge.createdAt).toBeInstanceOf(Date);
  });

  it("maps a not-found code to ApiError", async () => {
    await expect(resolveUserCode("000000")).rejects.toBeInstanceOf(ApiError);
  });
});
