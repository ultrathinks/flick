import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { sql } from "drizzle-orm";
import { type AuthVariables, requireAdmin } from "../auth/middleware.ts";
import { getDb } from "../db/index.ts";
import { booths, transactions } from "../db/schema/index.ts";
import { errorResponse, jsonContent } from "../openapi/helpers.ts";
import { statsSchema } from "../openapi/schemas.ts";

export const statsRoutes = new OpenAPIHono<{ Variables: AuthVariables }>();

statsRoutes.openapi(
  createRoute({
    method: "get",
    path: "/stats",
    tags: ["stats"],
    security: [{ Bearer: [] }],
    middleware: [requireAdmin] as const,
    responses: {
      200: jsonContent(statsSchema, "Aggregate stats"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
    },
  }),
  async (c) => {
    const db = getDb();
    const totals = await db
      .select({
        type: transactions.type,
        amount: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .groupBy(transactions.type);
    const boothSales = await db
      .select({
        boothId: booths.id,
        name: booths.name,
        amount: sql<number>`coalesce(sum(-${transactions.amount}), 0)`,
      })
      .from(booths)
      .leftJoin(
        transactions,
        sql`${transactions.orderId} in (select id from orders where booth_id = ${booths.id} and status = 'paid') and ${transactions.type} = 'purchase'`,
      )
      .groupBy(booths.id);
    return c.json({ totals, boothSales }, 200);
  },
);
