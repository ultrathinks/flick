import { randomUUID } from "node:crypto";
import { type Hook, OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import { getCorsOrigins, isProduction } from "./config.ts";
import { AppError, ValidationError } from "./lib/errors.ts";
import { logger } from "./lib/logger.ts";
import { adminRoutes } from "./routes/admin.ts";
import { authRoutes } from "./routes/auth.ts";
import { boothsRoutes } from "./routes/booths.ts";
import { kiosksRoutes } from "./routes/kiosks.ts";
import { moneyRoutes } from "./routes/money.ts";
import {
  ordersRoutes,
  paymentCodesRoutes,
  paymentsRoutes,
} from "./routes/orders.ts";
import { payoutsRoutes } from "./routes/payouts.ts";
import { productsRoutes } from "./routes/products.ts";
import { statsRoutes } from "./routes/stats.ts";
import { uploadsRoutes } from "./routes/uploads.ts";
import { usersRoutes } from "./routes/users.ts";

// biome-ignore lint/suspicious/noExplicitAny: hook context type varies per route
const defaultHook: Hook<unknown, any, any, unknown> = (result) => {
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.join(".");
    const message = issue
      ? path
        ? `${path}: ${issue.message}`
        : issue.message
      : "Validation failed";
    throw new ValidationError(message);
  }
};

export const app = new OpenAPIHono<{ Variables: { requestId: string } }>({
  defaultHook,
});

app.use("*", async (c, next) => {
  const requestId = c.req.header("x-request-id") ?? randomUUID();
  c.set("requestId", requestId);
  c.header("x-request-id", requestId);
  await next();
});

app.use("*", secureHeaders());

app.use(
  "*",
  cors({
    origin: (origin) => (getCorsOrigins().includes(origin) ? origin : null),
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Authorization", "Content-Type"],
    maxAge: 86400,
  }),
);

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json(
      { error: { code: err.code, message: err.message } },
      err.status,
    );
  }
  if (err instanceof HTTPException) {
    return c.json(
      { error: { code: "REQUEST_ERROR", message: err.message } },
      err.status,
    );
  }
  const requestId = c.get("requestId");
  logger.error(
    { err, requestId, method: c.req.method, path: c.req.path },
    "unhandled request error",
  );
  return c.json(
    {
      error: {
        code: "INTERNAL",
        message: "Internal server error",
        requestId,
      },
    },
    500,
  );
});

app.get("/health", (c) => c.json({ status: "ok" }));

const v1 = new OpenAPIHono({ defaultHook });

v1.route("/auth", authRoutes);
v1.route("/users", usersRoutes);
v1.route("/booths", boothsRoutes);
v1.route("/products", productsRoutes);
v1.route("/uploads", uploadsRoutes);
v1.route("/kiosks", kiosksRoutes);
v1.route("/orders", ordersRoutes);
v1.route("/payment-codes", paymentCodesRoutes);
v1.route("/payments", paymentsRoutes);
v1.route("/", moneyRoutes);
v1.route("/", payoutsRoutes);
v1.route("/", statsRoutes);
v1.route("/", adminRoutes);

const appRoutes = app.route("/v1", v1);

export type AppType = typeof appRoutes;

if (!isProduction()) {
  app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
    type: "http",
    scheme: "bearer",
    description: "User session access token",
  });
  app.openAPIRegistry.registerComponent("securitySchemes", "Kiosk", {
    type: "http",
    scheme: "bearer",
    description: "Kiosk device token",
  });

  app.doc("/v1/openapi.json", {
    openapi: "3.1.0",
    info: { title: "Flick API", version: "1.0.0" },
  });

  app.get("/v1/docs", Scalar({ url: "/v1/openapi.json" }));
}
