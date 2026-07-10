import { eq, sql } from "drizzle-orm";
import { getDb } from "../db/index.ts";
import { transactions, type User, users } from "../db/schema/index.ts";
import { generateDigitCode, generateUniqueCode } from "../lib/codes.ts";
import { BASE_GRANT_AMOUNT } from "../lib/constants.ts";
import type { DauthProfile } from "./dauth.ts";

export async function upsertByDauthId(user: DauthProfile): Promise<User> {
  return getDb().transaction(async (tx) => {
    const code = await generateUniqueCode(
      () => generateDigitCode(6),
      async (candidate) => {
        const [existing] = await tx
          .select({ id: users.id })
          .from(users)
          .where(eq(users.code, candidate))
          .limit(1);
        return Boolean(existing);
      },
    );
    const [row] = await tx
      .insert(users)
      .values({ ...user, code })
      .onConflictDoUpdate({
        target: users.dauthPublicId,
        set: {
          username: user.username,
          name: user.name,
          profileImageUrl: user.profileImageUrl,
          roles: user.roles,
          studentNumber: user.studentNumber,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!row) {
      throw new Error("failed to upsert user");
    }

    await tx
      .insert(transactions)
      .values({
        userId: row.id,
        amount: BASE_GRANT_AMOUNT,
        type: "grant",
      })
      .onConflictDoNothing();

    const [updated] = await tx
      .update(users)
      .set({
        balance: sql<number>`coalesce((select sum(${transactions.amount}) from ${transactions} where ${transactions.userId} = ${row.id}), 0)`,
        updatedAt: new Date(),
      })
      .where(sql`${users.id} = ${row.id}`)
      .returning();

    return updated ?? row;
  });
}

export function toPublicUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    profileImageUrl: user.profileImageUrl,
    roles: user.roles,
    isAdmin: user.isAdmin,
    studentNumber: user.studentNumber,
    balance: user.balance,
  };
}
