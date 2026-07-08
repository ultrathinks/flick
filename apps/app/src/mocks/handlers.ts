import { HttpResponse, http } from "msw";
import {
  lowBalanceView,
  me,
  order,
  orderWithItems,
  paymentCodeView,
  session,
  transactions,
  userCode,
} from "./fixtures.ts";

function errorResponse(status: number, code: string, message: string) {
  return HttpResponse.json({ error: { code, message } }, { status });
}

export const handlers = [
  http.get("/v1/users/me", () => HttpResponse.json(me)),
  http.get("/v1/users/me/transactions", () => HttpResponse.json(transactions)),
  http.get("/v1/users/me/code", () => HttpResponse.json(userCode)),
  http.get("/v1/payment-codes/:code", ({ params }) => {
    const code = String(params.code);
    if (code === "EXPIRED") {
      return errorResponse(404, "PAYMENT_EXPIRED", "payment expired");
    }
    if (code === "INVALID") {
      return errorResponse(404, "NOT_FOUND", "payment not found");
    }
    if (code === "LOWBAL") {
      return HttpResponse.json(lowBalanceView());
    }
    return HttpResponse.json(paymentCodeView());
  }),
  http.post("/v1/payment-codes/:code/confirm", ({ params }) => {
    const code = String(params.code);
    if (code === "OOS") {
      return errorResponse(400, "OUT_OF_STOCK", "out of stock");
    }
    if (code === "RACE") {
      return errorResponse(404, "PAYMENT_EXPIRED", "payment expired");
    }
    return HttpResponse.json(order);
  }),
  http.get("/v1/orders/:id", () => HttpResponse.json(orderWithItems)),
  http.post("/v1/auth/app", () => HttpResponse.json(session)),
  http.post("/v1/auth/refresh", () => HttpResponse.json(session)),
  http.post("/v1/auth/logout", () => new HttpResponse(null, { status: 204 })),
];
