import { z } from "zod";
import { request } from "@/shared/api";
import { type Transaction, transactionSchema } from "../model/types.ts";

const transactionListSchema = z.array(transactionSchema);

export function fetchMyTransactions(): Promise<Transaction[]> {
  return request(transactionListSchema, "users/me/transactions");
}
