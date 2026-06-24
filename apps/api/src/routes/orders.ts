import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, eq, inArray, sql } from "drizzle-orm";
import {
  type AuthVariables,
  requireAuth,
  requireKiosk,
} from "../auth/middleware.ts";
import { getDb } from "../db/index.ts";
import {
  booths,
  orderItems,
  orders,
  payments,
  products,
  transactions,
  users,
} from "../db/schema/index.ts";
import { PAYMENT_TTL_MS } from "../lib/constants.ts";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../lib/errors.ts";
import { rateLimit } from "../lib/rate-limit.ts";
import { generateSecret, hashSecret } from "../lib/security.ts";
import { errorResponse, jsonContent } from "../openapi/helpers.ts";
import {
  createPaymentSchema,
  orderSchema,
  orderWithItemsSchema,
  paymentCodeViewSchema,
  paymentWithOrderSchema,
} from "../openapi/schemas.ts";

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

const idParam = z.object({ id: z.string() });

export const ordersRoutes = new OpenAPIHono<{ Variables: AuthVariables }>();

ordersRoutes.openapi(
  createRoute({
    method: "post",
    path: "/",
    tags: ["orders"],
    security: [{ Kiosk: [] }],
    middleware: [requireKiosk] as const,
    request: {
      body: { content: { "application/json": { schema: createOrderSchema } } },
    },
    responses: {
      201: jsonContent(orderSchema, "Created order"),
      400: errorResponse("Bad request"),
      401: errorResponse("Unauthorized"),
    },
  }),
  async (c) => {
    const kiosk = c.get("kiosk");
    const body = c.req.valid("json");
    const productIds = body.items.map((item) => item.productId);
    const productRows = await getDb()
      .select()
      .from(products)
      .where(
        and(
          inArray(products.id, productIds),
          eq(products.boothId, kiosk.boothId),
        ),
      );
    if (productRows.length !== new Set(productIds).size) {
      throw new BadRequestError("invalid product");
    }
    const productById = new Map(
      productRows.map((product) => [product.id, product]),
    );
    const items = body.items.map((item) => {
      const product = productById.get(item.productId);
      if (product?.status !== "available") {
        throw new BadRequestError("unavailable product");
      }
      return {
        productId: product.id,
        name: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
        totalAmount: product.price * item.quantity,
      };
    });
    const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);
    const order = await getDb().transaction(async (tx) => {
      const [created] = await tx
        .insert(orders)
        .values({ boothId: kiosk.boothId, kioskId: kiosk.id, totalAmount })
        .returning();
      if (!created) {
        throw new Error("failed to create order");
      }
      await tx
        .insert(orderItems)
        .values(items.map((item) => ({ ...item, orderId: created.id })));
      return created;
    });
    return c.json(order, 201);
  },
);

ordersRoutes.openapi(
  createRoute({
    method: "get",
    path: "/{id}",
    tags: ["orders"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: { params: idParam },
    responses: {
      200: jsonContent(orderWithItemsSchema, "Order with items"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const orderId = c.req.valid("param").id;
    const user = c.get("user");
    const [row] = await getDb()
      .select({ order: orders, booth: booths })
      .from(orders)
      .innerJoin(booths, eq(orders.boothId, booths.id))
      .where(eq(orders.id, orderId));
    if (!row) {
      throw new NotFoundError("order not found");
    }
    if (
      !user.isAdmin &&
      row.booth.ownerId !== user.id &&
      row.order.buyerId !== user.id
    ) {
      throw new ForbiddenError();
    }
    const items = await getDb()
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
    return c.json({ ...row.order, items }, 200);
  },
);

ordersRoutes.openapi(
  createRoute({
    method: "post",
    path: "/{id}/cancel",
    tags: ["orders"],
    security: [{ Kiosk: [] }],
    middleware: [requireKiosk] as const,
    request: { params: idParam },
    responses: {
      200: jsonContent(orderSchema, "Canceled order"),
      401: errorResponse("Unauthorized"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const kiosk = c.get("kiosk");
    const orderId = c.req.valid("param").id;
    const now = new Date();
    const [order] = await getDb()
      .update(orders)
      .set({ status: "canceled", canceledAt: now })
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.kioskId, kiosk.id),
          eq(orders.status, "pending"),
        ),
      )
      .returning();
    if (!order) {
      throw new NotFoundError("order not found");
    }
    await getDb()
      .update(payments)
      .set({ status: "canceled" })
      .where(
        and(eq(payments.orderId, order.id), eq(payments.status, "pending")),
      );
    return c.json(order, 200);
  },
);

ordersRoutes.openapi(
  createRoute({
    method: "post",
    path: "/{id}/payments",
    tags: ["orders"],
    security: [{ Kiosk: [] }],
    middleware: [requireKiosk] as const,
    request: { params: idParam },
    responses: {
      201: jsonContent(createPaymentSchema, "Created payment"),
      401: errorResponse("Unauthorized"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const kiosk = c.get("kiosk");
    const orderId = c.req.valid("param").id;
    const code = generateSecret(24);
    const result = await getDb().transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.id, orderId),
            eq(orders.kioskId, kiosk.id),
            eq(orders.status, "pending"),
          ),
        )
        .limit(1);
      if (!order) {
        throw new NotFoundError("order not found");
      }
      await tx
        .update(payments)
        .set({ status: "expired" })
        .where(
          and(eq(payments.orderId, orderId), eq(payments.status, "pending")),
        );
      const [payment] = await tx
        .insert(payments)
        .values({
          orderId,
          codeHash: hashSecret(code),
          expiresAt: new Date(Date.now() + PAYMENT_TTL_MS),
        })
        .returning();
      if (!payment) {
        throw new Error("failed to create payment");
      }
      return payment;
    });
    return c.json({ payment: result, code }, 201);
  },
);

export const paymentCodesRoutes = new OpenAPIHono<{
  Variables: AuthVariables;
}>();

paymentCodesRoutes.openapi(
  createRoute({
    method: "get",
    path: "/{code}",
    tags: ["payment-codes"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth, rateLimit(60, "payment-codes:get")] as const,
    request: { params: z.object({ code: z.string() }) },
    responses: {
      200: jsonContent(paymentCodeViewSchema, "Payment code view"),
      401: errorResponse("Unauthorized"),
      404: errorResponse("Not found"),
      429: errorResponse("Too many requests"),
    },
  }),
  async (c) => {
    const codeHash = hashSecret(c.req.valid("param").code);
    const [row] = await getDb()
      .select({ payment: payments, order: orders, booth: booths })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .innerJoin(booths, eq(orders.boothId, booths.id))
      .where(eq(payments.codeHash, codeHash));
    if (
      row?.payment.status !== "pending" ||
      row.payment.expiresAt <= new Date()
    ) {
      throw new NotFoundError("payment not found");
    }
    const items = await getDb()
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, row.order.id));
    return c.json(
      {
        payment: row.payment,
        order: row.order,
        booth: row.booth,
        items,
        balance: c.get("user").balance,
      },
      200,
    );
  },
);

paymentCodesRoutes.openapi(
  createRoute({
    method: "post",
    path: "/{code}/confirm",
    tags: ["payment-codes"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth, rateLimit(30, "payment-codes:confirm")] as const,
    request: { params: z.object({ code: z.string() }) },
    responses: {
      200: jsonContent(orderSchema, "Confirmed order"),
      400: errorResponse("Bad request"),
      401: errorResponse("Unauthorized"),
      404: errorResponse("Not found"),
      429: errorResponse("Too many requests"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const codeHash = hashSecret(c.req.valid("param").code);
    const now = new Date();
    const result = await getDb().transaction(async (tx) => {
      const [row] = await tx
        .select({ payment: payments, order: orders })
        .from(payments)
        .innerJoin(orders, eq(payments.orderId, orders.id))
        .where(eq(payments.codeHash, codeHash))
        .for("update", { of: payments })
        .limit(1);
      if (!row) {
        throw new NotFoundError("payment not found");
      }
      if (
        row.payment.status === "completed" &&
        row.payment.confirmedBy === user.id
      ) {
        return row.order;
      }
      if (
        row.payment.status !== "pending" ||
        row.payment.expiresAt <= now ||
        row.order.status !== "pending"
      ) {
        throw new BadRequestError("payment is not pending");
      }
      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, row.order.id));
      const itemTotal = items.reduce((sum, item) => sum + item.totalAmount, 0);
      if (itemTotal !== row.order.totalAmount) {
        throw new BadRequestError("invalid order total");
      }
      const [freshUser] = await tx
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .for("update");
      if (!freshUser || freshUser.balance < row.order.totalAmount) {
        throw new BadRequestError("insufficient balance");
      }
      for (const item of items) {
        const [updatedProduct] = await tx
          .update(products)
          .set({ stock: sql<number>`${products.stock} - ${item.quantity}` })
          .where(
            and(
              eq(products.id, item.productId),
              sql`${products.stock} >= ${item.quantity}`,
            ),
          )
          .returning();
        if (!updatedProduct) {
          throw new BadRequestError("insufficient stock");
        }
      }
      const [transaction] = await tx
        .insert(transactions)
        .values({
          userId: user.id,
          amount: -row.order.totalAmount,
          type: "purchase",
          orderId: row.order.id,
          paymentId: row.payment.id,
        })
        .returning();
      if (!transaction) {
        throw new Error("failed to create transaction");
      }
      await tx
        .update(users)
        .set({
          balance: sql<number>`${users.balance} - ${row.order.totalAmount}`,
          updatedAt: now,
        })
        .where(eq(users.id, user.id));
      const [order] = await tx
        .update(orders)
        .set({ status: "paid", buyerId: user.id, paidAt: now })
        .where(eq(orders.id, row.order.id))
        .returning();
      await tx
        .update(payments)
        .set({ status: "completed", completedAt: now, confirmedBy: user.id })
        .where(eq(payments.id, row.payment.id));
      return order ?? row.order;
    });
    return c.json(result, 200);
  },
);

export const paymentsRoutes = new OpenAPIHono<{ Variables: AuthVariables }>();

paymentsRoutes.openapi(
  createRoute({
    method: "get",
    path: "/{id}",
    tags: ["payments"],
    security: [{ Kiosk: [] }],
    middleware: [requireKiosk] as const,
    request: { params: idParam },
    responses: {
      200: jsonContent(paymentWithOrderSchema, "Payment with order"),
      401: errorResponse("Unauthorized"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const kiosk = c.get("kiosk");
    const [row] = await getDb()
      .select({ payment: payments, order: orders })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .where(
        and(
          eq(payments.id, c.req.valid("param").id),
          eq(orders.kioskId, kiosk.id),
        ),
      );
    if (!row) {
      throw new NotFoundError("payment not found");
    }
    return c.json(row, 200);
  },
);

paymentsRoutes.get("/:id/events", requireKiosk, async (c) => {
  const kiosk = c.get("kiosk");
  const paymentId = c.req.param("id") as string;
  const [owned] = await getDb()
    .select({ id: payments.id })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .where(and(eq(payments.id, paymentId), eq(orders.kioskId, kiosk.id)));
  if (!owned) {
    throw new NotFoundError("payment not found");
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const close = () => {
        if (closed) {
          return;
        }
        closed = true;
        clearInterval(poll);
        clearInterval(heartbeat);
        clearTimeout(maxLifetime);
        try {
          controller.close();
        } catch {}
      };

      const poll = setInterval(async () => {
        try {
          const [payment] = await getDb()
            .select()
            .from(payments)
            .where(eq(payments.id, paymentId));
          if (payment && payment.status !== "pending") {
            controller.enqueue(
              encoder.encode(
                `event: ${payment.status}\ndata: ${JSON.stringify(payment)}\n\n`,
              ),
            );
            close();
          }
        } catch {
          close();
        }
      }, 1000);

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          close();
        }
      }, 15000);

      const maxLifetime = setTimeout(close, 5 * 60 * 1000);

      c.req.raw.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});
