import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { HTTPException } from "hono/http-exception";
import { AppError } from "./lib/errors.ts";
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
import { productOptionsRoutes } from "./routes/product-options.ts";
import { productsRoutes } from "./routes/products.ts";
import { statsRoutes } from "./routes/stats.ts";
import { uploadsRoutes } from "./routes/uploads.ts";
import { usersRoutes } from "./routes/users.ts";

export const app = new OpenAPIHono();

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
  console.error(err);
  return c.json(
    { error: { code: "INTERNAL", message: "Internal server error" } },
    500,
  );
});

app.get("/health", (c) => c.json({ status: "ok" }));

const v1 = new OpenAPIHono();

v1.route("/auth", authRoutes);
v1.route("/users", usersRoutes);
v1.route("/booths", boothsRoutes);
v1.route("/products", productsRoutes);
v1.route("/", productOptionsRoutes);
v1.route("/uploads", uploadsRoutes);
v1.route("/kiosks", kiosksRoutes);
v1.route("/orders", ordersRoutes);
v1.route("/payment-codes", paymentCodesRoutes);
v1.route("/payments", paymentsRoutes);
v1.route("/", moneyRoutes);
v1.route("/", payoutsRoutes);
v1.route("/", statsRoutes);

const appRoutes = app.route("/v1", v1);

export type AppType = typeof appRoutes;

if (process.env.NODE_ENV !== "production") {
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
