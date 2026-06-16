import { Hono } from "hono";
import { AppError } from "./lib/errors.ts";
import { authRoutes } from "./routes/auth.ts";

export const app = new Hono();

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json(
      { error: { code: err.code, message: err.message } },
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

app.route("/auth", authRoutes);
