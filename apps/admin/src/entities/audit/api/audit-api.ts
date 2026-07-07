import { useCursorQuery } from "@/shared/api";
import { auditLogSchema } from "../model/types.ts";

export function useAuditLogs(filters: { action?: string }) {
  return useCursorQuery({
    queryKey: ["audit-logs", filters.action ?? "all"],
    path: "audit-logs",
    itemSchema: auditLogSchema,
    searchParams: { action: filters.action },
  });
}
