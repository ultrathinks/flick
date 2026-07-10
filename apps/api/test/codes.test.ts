import { describe, expect, it } from "vitest";
import {
  generateDigitCode,
  generatePairingCode,
  generateUniqueCode,
} from "../src/lib/codes.ts";

describe("short codes", () => {
  it("generates 6-digit numeric codes", () => {
    for (let i = 0; i < 200; i += 1) {
      const code = generateDigitCode(6);
      expect(code).toMatch(/^[0-9]{6}$/);
    }
  });

  it("generates pairing codes without ambiguous characters", () => {
    for (let i = 0; i < 200; i += 1) {
      const code = generatePairingCode(6);
      expect(code).toMatch(/^[A-Z2-9]{6}$/);
      expect(code).not.toMatch(/[OIL01]/);
    }
  });

  it("retries until a non-colliding code is produced", async () => {
    const taken = new Set(["111111", "222222"]);
    const queue = ["111111", "222222", "333333"];
    const code = await generateUniqueCode(
      () => queue.shift() as string,
      async (candidate) => taken.has(candidate),
    );
    expect(code).toBe("333333");
  });

  it("throws when it cannot find a unique code", async () => {
    await expect(
      generateUniqueCode(
        () => "000000",
        async () => true,
        3,
      ),
    ).rejects.toThrow();
  });
});
