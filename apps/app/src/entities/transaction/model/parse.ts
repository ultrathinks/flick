import { type Transaction, transactionSchema } from "./types.ts";

export function parseTransaction(value: unknown): Transaction | null {
  const result = transactionSchema.safeParse(value);
  return result.success ? result.data : null;
}
