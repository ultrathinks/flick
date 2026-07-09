import type { SQL } from "drizzle-orm";
import { sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { BadRequestError } from "./errors.ts";

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

export type Cursor = {
  createdAtMicros: string;
  id: string;
};

export type Page<T> = {
  items: T[];
  nextCursor: string | null;
};

export function parseLimit(raw: string | undefined): number {
  if (raw === undefined) {
    return DEFAULT_PAGE_SIZE;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new BadRequestError("invalid limit");
  }
  return Math.min(value, MAX_PAGE_SIZE);
}

export function decodeCursor(raw: string | undefined): Cursor | null {
  if (!raw) {
    return null;
  }
  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as Cursor;
    if (
      typeof parsed.createdAtMicros !== "string" ||
      typeof parsed.id !== "string" ||
      !/^\d+$/.test(parsed.createdAtMicros) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        parsed.id,
      )
    ) {
      throw new Error("malformed cursor");
    }
    return parsed;
  } catch {
    throw new BadRequestError("invalid cursor");
  }
}

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function createdAtMicrosColumn(createdAt: PgColumn): SQL<string> {
  return sql<string>`(extract(epoch from ${createdAt}) * 1000000)::bigint::text`;
}

export function keysetCondition(
  createdAt: PgColumn,
  id: PgColumn,
  cursor: Cursor,
): SQL {
  return sql`(${createdAt}, ${id}) < (to_timestamp(${cursor.createdAtMicros}::numeric / 1000000.0), ${cursor.id}::uuid)`;
}
