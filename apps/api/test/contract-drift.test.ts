import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  PRODUCT_STATUSES,
  TRANSACTION_TYPES,
} from "@flick/contract";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closePool, getDb } from "../src/db/index.ts";

async function enumValues(typeName: string): Promise<string[]> {
  const result = await getDb().execute(
    sql`select e.enumlabel as label from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = ${typeName} order by e.enumsortorder`,
  );
  return (result.rows as Array<{ label: string }>).map((row) => row.label);
}

beforeAll(() => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set for integration tests");
  }
});

afterAll(async () => {
  await closePool();
});

describe("contract enums match the database", () => {
  it.each([
    ["order_status", ORDER_STATUSES],
    ["payment_status", PAYMENT_STATUSES],
    ["product_status", PRODUCT_STATUSES],
    ["transaction_type", TRANSACTION_TYPES],
  ] as const)("%s", async (typeName, contractValues) => {
    const dbValues = await enumValues(typeName);
    expect(dbValues.length).toBeGreaterThan(0);
    expect([...dbValues].sort()).toEqual([...contractValues].sort());
  });
});
