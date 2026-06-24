import { Hono } from "hono";
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
import { productsRoutes } from "./routes/products.ts";
import { statsRoutes } from "./routes/stats.ts";
import { usersRoutes } from "./routes/users.ts";

export const app = new Hono();

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

const v1 = new Hono();

v1.route("/auth", authRoutes);
v1.route("/users", usersRoutes);
v1.route("/booths", boothsRoutes);
v1.route("/products", productsRoutes);
v1.route("/kiosks", kiosksRoutes);
v1.route("/orders", ordersRoutes);
v1.route("/payment-codes", paymentCodesRoutes);
v1.route("/payments", paymentsRoutes);
v1.route("/", moneyRoutes);
v1.route("/", payoutsRoutes);
v1.route("/", statsRoutes);

app.route("/v1", v1);
