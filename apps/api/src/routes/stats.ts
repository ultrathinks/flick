import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { type AuthVariables, requireAdmin } from "../auth/middleware.ts";
import { getDb } from "../db/index.ts";
import { booths, transactions } from "../db/schema/index.ts";

export const statsRoutes = new Hono<{ Variables: AuthVariables }>();

statsRoutes.get("/stats", requireAdmin, async (c) => {
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
      sql`${transactions.orderId} in (select id from orders where booth_id = ${booths.id}) and ${transactions.type} = 'purchase'`,
    )
    .groupBy(booths.id);
  return c.json({ totals, boothSales });
});
