import { HttpResponse, http } from "msw";
import {
  auditLogs,
  booths,
  chargeTransaction,
  me,
  orders,
  payoutAccount,
  payouts,
  resolvedUser,
  stats,
  users,
} from "./fixtures.ts";

function errorResponse(status: number, code: string, message: string) {
  return HttpResponse.json({ error: { code, message } }, { status });
}

function page<T>(items: T[]) {
  return HttpResponse.json({ items, nextCursor: null });
}

export function createHandlers(base: string) {
  const url = (path: string) => `${base}/${path}`;

  return [
    http.get(url("users/me"), () => HttpResponse.json(me)),

    http.get(url("stats"), () => HttpResponse.json(stats)),

    http.get(url("booths"), () => HttpResponse.json(booths)),
    http.post(url("booths/:boothId/approve"), ({ params }) => {
      const booth = booths.find((b) => b.id === params.boothId) ?? booths[0];
      return HttpResponse.json({
        ...booth,
        status: "approved",
        approvedAt: new Date().toISOString(),
      });
    }),
    http.post(url("booths/:boothId/reject"), ({ params }) => {
      const booth = booths.find((b) => b.id === params.boothId) ?? booths[0];
      return HttpResponse.json({ ...booth, status: "rejected" });
    }),

    http.get(url("orders"), ({ request }) => {
      const status = new URL(request.url).searchParams.get("status");
      const rows = status ? orders.filter((o) => o.status === status) : orders;
      return page(rows);
    }),

    http.get(url("users"), ({ request }) => {
      const query = new URL(request.url).searchParams.get("q");
      const rows = query
        ? users.filter(
            (u) =>
              u.name.includes(query) ||
              u.username.includes(query) ||
              (u.studentNumber ?? "").includes(query),
          )
        : users;
      return page(rows);
    }),

    http.get(url("payouts"), ({ request }) => {
      const status = new URL(request.url).searchParams.get("status");
      const rows = status
        ? payouts.filter((p) => p.status === status)
        : payouts;
      return HttpResponse.json(rows);
    }),
    http.post(url("payouts/:payoutId/pay"), ({ params }) => {
      const payout =
        payouts.find((p) => p.id === params.payoutId) ?? payouts[0];
      return HttpResponse.json({
        ...payout,
        status: "paid",
        paidAt: new Date().toISOString(),
        paidBy: me.id,
      });
    }),
    http.post(url("payouts/:payoutId/reject"), ({ params }) => {
      const payout =
        payouts.find((p) => p.id === params.payoutId) ?? payouts[0];
      return HttpResponse.json({ ...payout, status: "rejected" });
    }),
    http.get(url("payouts/:payoutId/account"), () =>
      HttpResponse.json(payoutAccount),
    ),

    http.get(url("audit-logs"), ({ request }) => {
      const action = new URL(request.url).searchParams.get("action");
      const rows = action
        ? auditLogs.filter((log) => log.action === action)
        : auditLogs;
      return page(rows);
    }),

    http.post(url("user-codes/resolve"), async ({ request }) => {
      const input = (await request.json()) as Record<string, unknown>;
      const code = String(input.code ?? "");
      if (code === "INVALID") {
        return errorResponse(404, "NOT_FOUND", "code not found");
      }
      return HttpResponse.json(resolvedUser);
    }),
    http.post(url("charges"), async ({ request }) => {
      const input = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({
        ...chargeTransaction,
        userId: String(input.userId ?? chargeTransaction.userId),
        amount: Number(input.amount ?? chargeTransaction.amount),
        createdAt: new Date().toISOString(),
      });
    }),
  ];
}
