import { serve } from "@hono/node-server";
import { app } from "./app.ts";

function resolvePort(): number {
  const raw = process.env.PORT;
  if (raw === undefined) {
    return 3000;
  }
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`PORT is invalid: ${raw}`);
  }
  return port;
}

const port = resolvePort();

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`api listening on http://localhost:${info.port}`);
});
