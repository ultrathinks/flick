import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, types } from "pg";
import { loadConfig } from "../config.ts";
import { logger } from "../lib/logger.ts";
import * as schema from "./schema/index.ts";

types.setTypeParser(types.builtins.INT8, (value) => Number(value));
types.setTypeParser(types.builtins.NUMERIC, (value) => Number(value));

let pool: Pool | undefined;
let db: NodePgDatabase<typeof schema> | undefined;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: loadConfig().DATABASE_URL,
      options: "-c default_transaction_isolation=read\\ committed",
    });
    pool.on("error", (err) => {
      logger.error({ err }, "pg pool error on idle client");
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
    db = undefined;
  }
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!db) {
    db = drizzle(getPool(), { schema });
  }
  return db;
}

export type Db = NodePgDatabase<typeof schema>;
export type DbTransaction = Parameters<Parameters<Db["transaction"]>[0]>[0];
