import { zValidator } from "@hono/zod-validator";
import { desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import {
  type AuthVariables,
  requireAdmin,
  requireAuth,
} from "../auth/middleware.ts";
import { getDb } from "../db/index.ts";
import {
  auditLogs,
  type Payout,
  payouts,
  transactions,
  users,
} from "../db/schema/index.ts";
import { BASE_GRANT_AMOUNT } from "../lib/constants.ts";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../lib/errors.ts";
import {
  decryptText,
  encryptText,
  maskAccountNumber,
} from "../lib/security.ts";

const payoutSchema = z.object({
  bankName: z.string().min(1).max(64),
  accountNumber: z.string().min(1).max(64),
  accountHolder: z.string().min(1).max(64),
});

async function ledgerBalance(userId: string): Promise<number> {
  const [row] = await getDb()
    .select({ total: sql<number>`coalesce(sum(${transactions.amount}), 0)` })
    .from(transactions)
    .where(eq(transactions.userId, userId));
  return row?.total ?? 0;
}

function maskedPayout(row: Payout) {
  return {
    id: row.id,
    userId: row.userId,
    amount: row.amount,
    status: row.status,
    accountHolder: decryptText(row.accountHolder),
    bankName: decryptText(row.bankName),
    accountNumber: maskAccountNumber(decryptText(row.accountNumber)),
    paidAt: row.paidAt,
    paidBy: row.paidBy,
    createdAt: row.createdAt,
  };
}

export const payoutsRoutes = new Hono<{ Variables: AuthVariables }>();

payoutsRoutes.get("/users/me/payout", requireAuth, async (c) => {
  const user = c.get("user");
  const [existing] = await getDb()
    .select()
    .from(payouts)
    .where(eq(payouts.userId, user.id))
    .orderBy(desc(payouts.createdAt))
    .limit(1);
  const availableAmount = Math.max(
    0,
    (await ledgerBalance(user.id)) - BASE_GRANT_AMOUNT,
  );
  return c.json({
    availableAmount,
    request: existing
      ? {
          id: existing.id,
          amount: existing.amount,
          status: existing.status,
          createdAt: existing.createdAt,
        }
      : null,
  });
});

payoutsRoutes.post(
  "/users/me/payout",
  requireAuth,
  zValidator("json", payoutSchema),
  async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");
    const result = await getDb().transaction(async (tx) => {
      const [balanceRow] = await tx
        .select({
          total: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
        })
        .from(transactions)
        .where(eq(transactions.userId, user.id));
      const amount = Math.max(0, (balanceRow?.total ?? 0) - BASE_GRANT_AMOUNT);
      if (amount <= 0) {
        throw new BadRequestError("no payable balance");
      }
      const [row] = await tx
        .insert(payouts)
        .values({
          userId: user.id,
          amount,
          bankName: encryptText(body.bankName),
          accountNumber: encryptText(body.accountNumber),
          accountHolder: encryptText(body.accountHolder),
        })
        .onConflictDoNothing()
        .returning();
      if (!row) {
        throw new ConflictError("payout already requested");
      }
      return row;
    });
    return c.json(
      {
        id: result.id,
        amount: result.amount,
        status: result.status,
        createdAt: result.createdAt,
      },
      201,
    );
  },
);

payoutsRoutes.get("/payouts", requireAdmin, async (c) => {
  const status = c.req.query("status");
  const rows = await getDb()
    .select()
    .from(payouts)
    .orderBy(desc(payouts.createdAt));
  const filtered = status ? rows.filter((row) => row.status === status) : rows;
  return c.json(filtered.map(maskedPayout));
});

payoutsRoutes.get("/payouts/:id/account", requireAdmin, async (c) => {
  const admin = c.get("user");
  const payoutId = c.req.param("id") as string;
  const [row] = await getDb()
    .select()
    .from(payouts)
    .where(eq(payouts.id, payoutId));
  if (!row) {
    throw new NotFoundError("payout not found");
  }
  await getDb().insert(auditLogs).values({
    actorId: admin.id,
    action: "payout.view_plain_account",
    targetType: "payout",
    targetId: payoutId,
  });
  return c.json({
    bankName: decryptText(row.bankName),
    accountNumber: decryptText(row.accountNumber),
    accountHolder: decryptText(row.accountHolder),
  });
});

payoutsRoutes.post("/payouts/:id/pay", requireAdmin, async (c) => {
  const admin = c.get("user");
  const payoutId = c.req.param("id") as string;
  const result = await getDb().transaction(async (tx) => {
    const [payout] = await tx
      .select()
      .from(payouts)
      .where(eq(payouts.id, payoutId))
      .for("update");
    if (!payout) {
      throw new NotFoundError("payout not found");
    }
    if (payout.status !== "requested") {
      throw new ConflictError("payout is not requested");
    }
    await tx
      .select()
      .from(users)
      .where(eq(users.id, payout.userId))
      .for("update");
    const [transaction] = await tx
      .insert(transactions)
      .values({
        userId: payout.userId,
        amount: -payout.amount,
        type: "payout",
        adminId: admin.id,
      })
      .returning();
    if (!transaction) {
      throw new Error("failed to create payout transaction");
    }
    await tx
      .update(users)
      .set({
        balance: sql<number>`${users.balance} - ${payout.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, payout.userId));
    const [updated] = await tx
      .update(payouts)
      .set({
        status: "paid",
        paidAt: new Date(),
        paidBy: admin.id,
        payoutTransactionId: transaction.id,
      })
      .where(eq(payouts.id, payoutId))
      .returning();
    await tx.insert(auditLogs).values({
      actorId: admin.id,
      action: "payout.pay",
      targetType: "payout",
      targetId: payoutId,
      metadata: { amount: payout.amount },
    });
    return updated;
  });
  if (!result) {
    throw new NotFoundError("payout not found");
  }
  return c.json(maskedPayout(result));
});

payoutsRoutes.post("/payouts/:id/reject", requireAdmin, async (c) => {
  const admin = c.get("user");
  const payoutId = c.req.param("id") as string;
  const [row] = await getDb()
    .update(payouts)
    .set({ status: "rejected" })
    .where(eq(payouts.id, payoutId))
    .returning();
  if (!row) {
    throw new NotFoundError("payout not found");
  }
  await getDb().insert(auditLogs).values({
    actorId: admin.id,
    action: "payout.reject",
    targetType: "payout",
    targetId: payoutId,
  });
  return c.json(maskedPayout(row));
});
