import { HttpResponse, http } from "msw";
import {
  me,
  order,
  orderWithItems,
  paymentCodeView,
  session,
  transactions,
  userCode,
} from "./fixtures.ts";

export const handlers = [
  http.get("/v1/users/me", () => HttpResponse.json(me)),
  http.get("/v1/users/me/transactions", () => HttpResponse.json(transactions)),
  http.get("/v1/users/me/code", () => HttpResponse.json(userCode)),
  http.post("/v1/users/me/code/rotate", () => HttpResponse.json(userCode)),
  http.get("/v1/payment-codes/:code", () =>
    HttpResponse.json(paymentCodeView()),
  ),
  http.post("/v1/payment-codes/:code/confirm", () => HttpResponse.json(order)),
  http.get("/v1/orders/:id", () => HttpResponse.json(orderWithItems)),
  http.post("/v1/auth/dodam", () => HttpResponse.json(session)),
  http.post("/v1/auth/refresh", () => HttpResponse.json(session)),
  http.post("/v1/auth/logout", () => new HttpResponse(null, { status: 204 })),
];
