import { z } from "zod";
import { request } from "@/shared/api";

export const resolvedUserSchema = z.object({
  userId: z.string(),
  name: z.string(),
  roles: z.array(z.string()),
  studentNumber: z.string().nullable(),
  balance: z.number(),
});

export const chargeTransactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  amount: z.number(),
  type: z.string(),
  createdAt: z.coerce.date(),
});

export type ResolvedUser = z.infer<typeof resolvedUserSchema>;
export type ChargeTransaction = z.infer<typeof chargeTransactionSchema>;

export function resolveUserCode(code: string): Promise<ResolvedUser> {
  return request(resolvedUserSchema, "user-codes/resolve", {
    method: "post",
    json: { code },
  });
}

export function createCharge(params: {
  userId: string;
  amount: number;
  idempotencyKey: string;
}): Promise<ChargeTransaction> {
  return request(chargeTransactionSchema, "charges", {
    method: "post",
    json: params,
  });
}
