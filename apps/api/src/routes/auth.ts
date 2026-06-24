import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
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
import { errorResponse, jsonContent } from "../openapi/helpers.ts";
import { sessionSchema } from "../openapi/schemas.ts";

const dodamSchema = z.object({
  token: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const authRoutes = new OpenAPIHono<{ Variables: AuthVariables }>();

authRoutes.openapi(
  createRoute({
    method: "post",
    path: "/dodam",
    tags: ["auth"],
    middleware: [rateLimit(20, "auth:dodam")] as const,
    request: {
      body: { content: { "application/json": { schema: dodamSchema } } },
    },
    responses: {
      200: jsonContent(sessionSchema, "Issued session"),
      401: errorResponse("Unauthorized"),
      429: errorResponse("Too many requests"),
    },
  }),
  async (c) => {
    const { token } = c.req.valid("json");
    const oauthAccessToken = await exchangeDodamToken(token);
    const userInfo = await getUserInfo(oauthAccessToken);
    const user = await upsertByDauthId(userInfo);
    const session = await issueSession(user.id);
    return c.json(session, 200);
  },
);

authRoutes.openapi(
  createRoute({
    method: "post",
    path: "/refresh",
    tags: ["auth"],
    middleware: [rateLimit(30, "auth:refresh")] as const,
    request: {
      body: { content: { "application/json": { schema: refreshSchema } } },
    },
    responses: {
      200: jsonContent(sessionSchema, "Rotated session"),
      401: errorResponse("Unauthorized"),
      429: errorResponse("Too many requests"),
    },
  }),
  async (c) => {
    const { refreshToken } = c.req.valid("json");
    const session = await rotateRefresh(refreshToken);
    if (!session) {
      throw new UnauthorizedError("invalid refresh token");
    }
    return c.json(session, 200);
  },
);

authRoutes.openapi(
  createRoute({
    method: "post",
    path: "/logout",
    tags: ["auth"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    responses: {
      204: { description: "Logged out" },
      401: errorResponse("Unauthorized"),
    },
  }),
  async (c) => {
    const token = extractBearerToken(c);
    if (token) {
      await revokeSession(token);
    }
    return c.body(null, 204);
  },
);
