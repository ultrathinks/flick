import { delay, HttpResponse, http } from "msw";
import { booth, kiosk, makeOrder, makePayment, products } from "./fixtures.ts";

const PAYMENT_EXPIRES_MS = 5 * 60 * 1000;
const AUTO_COMPLETE_MS = 8000;

type CreateOrderBody = {
  items: { productId: string; quantity: number }[];
};

let lastOrderTotal = 0;

function errorResponse(status: number, code: string, message: string) {
  return HttpResponse.json({ error: { code, message } }, { status });
}

function totalFor(items: CreateOrderBody["items"]) {
  return items.reduce((sum, item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
}

function paymentEventStream() {
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setTimeout>;
  return new ReadableStream({
    start(controller) {
      timer = setTimeout(() => {
        const frame = `event: completed\ndata: ${JSON.stringify({ status: "completed" })}\n\n`;
        controller.enqueue(encoder.encode(frame));
        controller.close();
      }, AUTO_COMPLETE_MS);
    },
    cancel() {
      clearTimeout(timer);
    },
  });
}

export const handlers = [
  http.post("/v1/kiosks/pair", async ({ request }) => {
    await delay(400);
    const { code } = (await request.json()) as { code: string };
    if (code === "EXPIRED") {
      return errorResponse(400, "INVALID_CODE", "expired pairing code");
    }
    if (code === "BUSY") {
      return errorResponse(429, "TOO_MANY_REQUESTS", "rate limited");
    }
    return HttpResponse.json({ kiosk, deviceToken: "mock-device-token" });
  }),

  http.get("/v1/kiosks/me", () => HttpResponse.json({ kiosk, booth })),

  http.get("/v1/kiosks/me/products", async () => {
    await delay(300);
    return HttpResponse.json(products);
  }),

  http.post("/v1/orders", async ({ request }) => {
    const body = (await request.json()) as CreateOrderBody;
    lastOrderTotal = totalFor(body.items);
    return HttpResponse.json(makeOrder(lastOrderTotal));
  }),

  http.post("/v1/orders/:id/cancel", () =>
    HttpResponse.json({ ...makeOrder(lastOrderTotal), status: "canceled" }),
  ),

  http.post("/v1/orders/:id/payments", async () => {
    await delay(300);
    return HttpResponse.json({
      payment: makePayment(PAYMENT_EXPIRES_MS),
      code: "FLICK-1234",
    });
  }),

  http.get("/v1/payments/:id", () =>
    HttpResponse.json({
      payment: makePayment(PAYMENT_EXPIRES_MS),
      order: makeOrder(lastOrderTotal),
    }),
  ),

  http.get("/v1/payments/:id/events", () => {
    return new HttpResponse(paymentEventStream(), {
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      },
    });
  }),
];
