import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { exchangeDodamToken, getUserInfo } from "../auth/dodam.ts";
import {
  type AuthVariables,
  extractBearerToken,
  requireAuth,
} from "../auth/middleware.ts";
import { issueSession, revokeSession, rotateRefresh } from "../auth/session.ts";
import { upsertByDauthId } from "../auth/users.ts";
import { UnauthorizedError } from "../lib/errors.ts";
import { rateLimit } from "../lib/rate-limit.ts";

const dodamSchema = z.object({
  token: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const authRoutes = new Hono<{ Variables: AuthVariables }>();

authRoutes.post(
  "/dodam",
  rateLimit(20, "auth:dodam"),
  zValidator("json", dodamSchema),
  async (c) => {
    const { token } = c.req.valid("json");
    const oauthAccessToken = await exchangeDodamToken(token);
    const userInfo = await getUserInfo(oauthAccessToken);
    const user = await upsertByDauthId(userInfo);
    const session = await issueSession(user.id);
    return c.json(session);
  },
);

authRoutes.post(
  "/refresh",
  rateLimit(30, "auth:refresh"),
  zValidator("json", refreshSchema),
  async (c) => {
    const { refreshToken } = c.req.valid("json");
    const session = await rotateRefresh(refreshToken);
    if (!session) {
      throw new UnauthorizedError("invalid refresh token");
    }
    return c.json(session);
  },
);

authRoutes.post("/logout", requireAuth, async (c) => {
  const token = extractBearerToken(c);
  if (token) {
    await revokeSession(token);
  }
  return c.body(null, 204);
});
