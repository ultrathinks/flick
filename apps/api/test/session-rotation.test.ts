import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { issueSession, rotateRefresh } from "../src/auth/session.ts";
import { createUser, resetDb } from "./helpers.ts";

beforeAll(() => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set for integration tests");
  }
});

beforeEach(async () => {
  await resetDb();
});

describe("rotateRefresh", () => {
  it("rotates the refresh token and issues a new pair", async () => {
    const user = await createUser();
    const { refreshToken } = await issueSession(user.id);

    const rotated = await rotateRefresh(refreshToken);

    expect(rotated).not.toBeNull();
    expect(rotated?.refreshToken).not.toBe(refreshToken);
    expect(rotated?.accessToken).toBeTruthy();
  });

  it("rejects an unknown refresh token", async () => {
    const result = await rotateRefresh("not-a-real-token");
    expect(result).toBeNull();
  });

  it("accepts the previous token within the grace window", async () => {
    const user = await createUser();
    const { refreshToken } = await issueSession(user.id);

    const first = await rotateRefresh(refreshToken);
    expect(first).not.toBeNull();

    const graced = await rotateRefresh(refreshToken);
    expect(graced).not.toBeNull();
    expect(graced?.refreshToken).not.toBe(refreshToken);
  });

  it("keeps the winner's token valid after a concurrent grace rotation", async () => {
    const user = await createUser();
    const { refreshToken } = await issueSession(user.id);

    const winner = await rotateRefresh(refreshToken);
    expect(winner).not.toBeNull();

    await rotateRefresh(refreshToken);

    const winnerAgain = await rotateRefresh(winner?.refreshToken ?? "");
    expect(winnerAgain).not.toBeNull();
  });

  it("rejects a refresh token that was replaced before any grace rotation", async () => {
    const user = await createUser();
    const { refreshToken } = await issueSession(user.id);

    const first = await rotateRefresh(refreshToken);
    expect(first).not.toBeNull();
    const second = await rotateRefresh(first?.refreshToken ?? "");
    expect(second).not.toBeNull();

    const stale = await rotateRefresh(refreshToken);
    expect(stale).toBeNull();
  });
});
