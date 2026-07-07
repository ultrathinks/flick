import { z } from "zod";

export const auditLogSchema = z.object({
  id: z.string(),
  actorId: z.string(),
  actorName: z.string(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  metadata: z.unknown().nullable(),
  createdAt: z.coerce.date(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;

export function auditAmount(metadata: unknown): number | null {
  if (
    typeof metadata === "object" &&
    metadata !== null &&
    "amount" in metadata &&
    typeof (metadata as { amount: unknown }).amount === "number"
  ) {
    return (metadata as { amount: number }).amount;
  }
  return null;
}
