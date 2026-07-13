import { HttpResponse, http } from "msw";
import { chargeTransaction, me, resolvedUser, session } from "./fixtures.ts";

function errorResponse(status: number, code: string, message: string) {
  return HttpResponse.json({ error: { code, message } }, { status });
}

export const handlers = [
  http.post("/v1/auth/app", () => HttpResponse.json(session)),
  http.post("/v1/auth/refresh", () => HttpResponse.json(session)),
  http.post("/v1/auth/logout", () => new HttpResponse(null, { status: 204 })),
  http.get("/v1/users/me", () => HttpResponse.json(me)),
  http.post("/v1/user-codes/resolve", async ({ request }) => {
    const { code } = (await request.json()) as { code: string };
    if (code === "000000" || code === "INVALID") {
      return errorResponse(404, "NOT_FOUND", "code not found");
    }
    return HttpResponse.json(resolvedUser);
  }),
  http.post("/v1/charges", async ({ request }) => {
    const { amount } = (await request.json()) as { amount: number };
    return HttpResponse.json(chargeTransaction(amount));
  }),
];
