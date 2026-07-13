import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, types } from "pg";
import { loadConfig } from "../config.ts";
import { logger } from "../lib/logger.ts";
import * as schema from "./schema/index.ts";

types.setTypeParser(types.builtins.INT8, (value) => Number(value));
types.setTypeParser(types.builtins.NUMERIC, (value) => Number(value));

const READ_STATEMENT_TIMEOUT_MS = 5000;

let pool: Pool | undefined;
let db: NodePgDatabase<typeof schema> | undefined;
let readPool: Pool | undefined;
let readDb: NodePgDatabase<typeof schema> | undefined;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: loadConfig().DATABASE_URL,
      options: "-c default_transaction_isolation=read\\ committed",
      max: 20,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
    });
    pool.on("error", (err) => {
      logger.error({ err }, "pg pool error on idle client");
    });
  }
  return pool;
}

function getReadPool(): Pool {
  if (!readPool) {
    readPool = new Pool({
      connectionString: loadConfig().DATABASE_URL,
      options: `-c default_transaction_isolation=read\\ committed -c statement_timeout=${READ_STATEMENT_TIMEOUT_MS}`,
      max: 4,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
    });
    readPool.on("error", (err) => {
      logger.error({ err }, "pg read pool error on idle client");
    });
  }
  return readPool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
    db = undefined;
  }
  if (readPool) {
    await readPool.end();
    readPool = undefined;
    readDb = undefined;
  }
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!db) {
    db = drizzle(getPool(), { schema });
  }
  return db;
}

export function getReadDb(): NodePgDatabase<typeof schema> {
  if (!readDb) {
    readDb = drizzle(getReadPool(), { schema });
  }
  return readDb;
}

export type Db = NodePgDatabase<typeof schema>;
export type DbTransaction = Parameters<Parameters<Db["transaction"]>[0]>[0];
