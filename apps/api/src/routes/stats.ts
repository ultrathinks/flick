import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { asc, desc, eq, sql } from "drizzle-orm";
import { type AuthVariables, requireAdmin } from "../auth/middleware.ts";
import { getDb } from "../db/index.ts";
import {
  booths,
  orderItems,
  orders,
  products,
  transactions,
  users,
} from "../db/schema/index.ts";
import { BASE_GRANT_AMOUNT } from "../lib/constants.ts";
import { errorResponse, jsonContent } from "../openapi/helpers.ts";
import { reportSchema, statsSchema } from "../openapi/schemas.ts";

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
        sql`${transactions.orderId} in (select id from orders where booth_id = ${booths.id} and status in ('paid', 'refunded')) and ${transactions.type} = 'purchase'`,
      )
      .groupBy(booths.id);
    return c.json({ totals, boothSales }, 200);
  },
);

statsRoutes.openapi(
  createRoute({
    method: "get",
    path: "/report",
    tags: ["stats"],
    security: [{ Bearer: [] }],
    middleware: [requireAdmin] as const,
    responses: {
      200: jsonContent(reportSchema, "Settlement report"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
    },
  }),
  async (c) => {
    const db = getDb();

    const [totalChargedRow] = await db
      .select({
        value: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(eq(transactions.type, "charge"));

    const [totalRevenueRow] = await db
      .select({
        value: sql<number>`coalesce(sum(-${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(
        sql`${transactions.type} = 'purchase' and ${transactions.orderId} in (select id from orders where status in ('paid', 'refunded'))`,
      );

    const [totalRefundRow] = await db
      .select({
        value: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(eq(transactions.type, "refund"));

    const [userCountRow] = await db
      .select({ value: sql<number>`count(*)` })
      .from(users);

    const [orderCountRow] = await db
      .select({ value: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, "paid"));

    const [refundableRow] = await db
      .select({
        value: sql<number>`coalesce(sum(greatest(${users.balance} - ${BASE_GRANT_AMOUNT}, 0)), 0)`,
      })
      .from(users);

    const [unregisteredRow] = await db
      .select({
        count: sql<number>`count(*)`,
        total: sql<number>`coalesce(sum(${users.balance} - ${BASE_GRANT_AMOUNT}), 0)`,
      })
      .from(users)
      .where(
        sql`${users.balance} > ${BASE_GRANT_AMOUNT} and not exists (select 1 from payouts where payouts.user_id = ${users.id})`,
      );

    const [balanceSumRow] = await db
      .select({ value: sql<number>`coalesce(sum(${users.balance}), 0)` })
      .from(users);

    const [ledgerSumRow] = await db
      .select({ value: sql<number>`coalesce(sum(${transactions.amount}), 0)` })
      .from(transactions);

    const totalCharged = Number(totalChargedRow?.value ?? 0);
    const totalRevenue = Number(totalRevenueRow?.value ?? 0);
    const totalRefund = Number(totalRefundRow?.value ?? 0);
    const reconciliation =
      Number(balanceSumRow?.value ?? 0) - Number(ledgerSumRow?.value ?? 0);

    const summary = {
      totalCharged,
      totalRevenue,
      netDonation: totalRevenue - totalRefund,
      userCount: Number(userCountRow?.value ?? 0),
      orderCount: Number(orderCountRow?.value ?? 0),
      refundableTotal: Number(refundableRow?.value ?? 0),
      unregisteredCount: Number(unregisteredRow?.count ?? 0),
      unregisteredTotal: Number(unregisteredRow?.total ?? 0),
      reconciliation,
    };

    const boothRankingRows = await db
      .select({
        name: booths.name,
        revenue: sql<number>`coalesce(sum(-${transactions.amount}), 0)`,
      })
      .from(booths)
      .leftJoin(
        transactions,
        sql`${transactions.orderId} in (select id from orders where booth_id = ${booths.id} and status in ('paid', 'refunded')) and ${transactions.type} = 'purchase'`,
      )
      .groupBy(booths.id)
      .orderBy(desc(sql`coalesce(sum(-${transactions.amount}), 0)`));

    const boothRanking = boothRankingRows.map((row) => ({
      name: row.name,
      revenue: Number(row.revenue),
    }));

    const menuSalesRows = await db
      .select({
        boothName: booths.name,
        menuName: sql<string>`coalesce(${products.name}, max(${orderItems.name}))`,
        quantity: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
        revenue: sql<number>`coalesce(sum(${orderItems.totalAmount}), 0)`,
      })
      .from(orderItems)
      .innerJoin(
        orders,
        sql`${orders.id} = ${orderItems.orderId} and ${orders.status} in ('paid', 'refunded')`,
      )
      .innerJoin(booths, eq(booths.id, orders.boothId))
      .leftJoin(products, eq(products.id, orderItems.productId))
      .groupBy(booths.id, booths.name, orderItems.productId, products.name)
      .orderBy(
        asc(booths.name),
        desc(sql`coalesce(sum(${orderItems.totalAmount}), 0)`),
      );

    const menuSales = menuSalesRows.map((row) => ({
      boothName: row.boothName,
      menuName: row.menuName,
      quantity: Number(row.quantity),
      revenue: Number(row.revenue),
    }));

    const unregisteredRows = await db
      .select({
        name: users.name,
        studentNumber: users.studentNumber,
        amount: sql<number>`${users.balance} - ${BASE_GRANT_AMOUNT}`,
      })
      .from(users)
      .where(
        sql`${users.balance} > ${BASE_GRANT_AMOUNT} and not exists (select 1 from payouts where payouts.user_id = ${users.id})`,
      )
      .orderBy(desc(sql`${users.balance} - ${BASE_GRANT_AMOUNT}`));

    const unregistered = unregisteredRows.map((row) => ({
      name: row.name,
      studentNumber: row.studentNumber,
      amount: Number(row.amount),
    }));

    const ledgerRows = await db
      .select({
        createdAt: transactions.createdAt,
        userName: users.name,
        studentNumber: users.studentNumber,
        type: transactions.type,
        amount: transactions.amount,
      })
      .from(transactions)
      .innerJoin(users, eq(users.id, transactions.userId))
      .orderBy(asc(transactions.createdAt));

    const ledger = ledgerRows.map((row) => ({
      createdAt: row.createdAt,
      userName: row.userName,
      studentNumber: row.studentNumber,
      type: row.type,
      amount: Number(row.amount),
    }));

    return c.json(
      { summary, boothRanking, menuSales, unregistered, ledger },
      200,
    );
  },
);
