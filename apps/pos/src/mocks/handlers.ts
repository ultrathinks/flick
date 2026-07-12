import { HttpResponse, http } from "msw";
import { booth, boothKiosks, me, orders, products } from "./fixtures.ts";

function errorResponse(status: number, code: string, message: string) {
  return HttpResponse.json({ error: { code, message } }, { status });
}

function nowIso(): string {
  return new Date().toISOString();
}

function randomId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

type OptionValueInput = {
  name?: string;
  priceDelta?: number;
  isDefault?: boolean;
  sortOrder?: number;
};

type OptionGroupInput = {
  name?: string;
  required?: boolean;
  maxSelect?: number | null;
  sortOrder?: number;
  values?: OptionValueInput[];
};

function materializeOptions(
  productId: string,
  input: OptionGroupInput[] | undefined,
) {
  if (!input) {
    return [];
  }
  return input.map((group, groupIndex) => {
    const groupId = randomId("group");
    return {
      id: groupId,
      productId,
      name: String(group.name ?? ""),
      required: Boolean(group.required ?? true),
      maxSelect: group.maxSelect ?? null,
      sortOrder: group.sortOrder ?? groupIndex,
      archivedAt: null,
      createdAt: nowIso(),
      values: (group.values ?? []).map((value, valueIndex) => ({
        id: randomId("value"),
        groupId,
        name: String(value.name ?? ""),
        priceDelta: Number(value.priceDelta ?? 0),
        isDefault: Boolean(value.isDefault ?? false),
        sortOrder: value.sortOrder ?? valueIndex,
        archivedAt: null,
        createdAt: nowIso(),
      })),
    };
  });
}

export function createHandlers(base: string) {
  const url = (path: string) => `${base}/${path}`;

  return [
    http.get(url("users/me"), () => HttpResponse.json(me)),

    http.get(url("booths"), () => HttpResponse.json([booth])),
    http.post(url("booths"), async ({ request }) => {
      const input = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({
        ...booth,
        id: randomId("booth"),
        name: String(input.name ?? booth.name),
        description: (input.description as string | undefined) ?? null,
        imageUrl: (input.imageUrl as string | undefined) ?? null,
        status: "draft",
        approvedAt: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    }),
    http.patch(url("booths/:id"), async ({ request }) => {
      const input = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({
        ...booth,
        ...input,
        updatedAt: nowIso(),
      });
    }),

    http.get(url("booths/:boothId/products"), () =>
      HttpResponse.json(products),
    ),
    http.post(url("booths/:boothId/products"), async ({ params, request }) => {
      const input = (await request.json()) as Record<string, unknown>;
      const id = randomId("product");
      return HttpResponse.json({
        id,
        boothId: String(params.boothId),
        name: String(input.name ?? ""),
        description: (input.description as string | undefined) ?? null,
        imageUrl: (input.imageUrl as string | undefined) ?? null,
        price: Number(input.price ?? 0),
        stock: (input.stock as number | null) ?? null,
        status: (input.status as string | undefined) ?? "available",
        sortOrder: Number(input.sortOrder ?? 0),
        archivedAt: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        optionGroups: materializeOptions(
          id,
          input.options as OptionGroupInput[] | undefined,
        ),
      });
    }),
    http.patch(url("products/:id"), async ({ params, request }) => {
      const input = (await request.json()) as Record<string, unknown>;
      const id = String(params.id);
      const target = products.find((p) => p.id === id) ?? products[0];
      const { options, ...rest } = input;
      return HttpResponse.json({
        ...target,
        ...rest,
        id,
        updatedAt: nowIso(),
        optionGroups:
          options !== undefined
            ? materializeOptions(id, options as OptionGroupInput[] | undefined)
            : (target?.optionGroups ?? []),
      });
    }),
    http.delete(
      url("products/:id"),
      () => new HttpResponse(null, { status: 204 }),
    ),

    http.get(url("booths/:boothId/kiosks"), () =>
      HttpResponse.json(boothKiosks),
    ),
    http.post(url("booths/:boothId/kiosks"), async ({ params, request }) => {
      const input = (await request.json()) as Record<string, unknown>;
      const pairing = {
        id: randomId("kiosk"),
        boothId: String(params.boothId),
        kioskName: String(input.name ?? "새 키오스크"),
        expiresAt: "2026-12-31T23:59:59+09:00",
        claimedAt: null,
        createdBy: me.id,
        createdAt: nowIso(),
      };
      return HttpResponse.json({ pairing, code: "K7P2Q9" }, { status: 201 });
    }),
    http.post(url("kiosks/:id/revoke"), ({ params }) =>
      HttpResponse.json({
        id: String(params.id),
        boothId: booth.id,
        name: "키오스크",
        lastSeenAt: null,
        revokedAt: nowIso(),
        createdAt: nowIso(),
      }),
    ),

    http.get(url("booths/:boothId/events"), () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(": connected\n\n"));
        },
      });
      return new HttpResponse(stream, {
        headers: { "Content-Type": "text/event-stream" },
      });
    }),

    http.get(url("booths/:boothId/orders"), () =>
      HttpResponse.json({ items: orders, nextCursor: null }),
    ),

    http.get(url("booths/:boothId/sales"), () => {
      const paid = orders.filter((o) => o.status === "paid");
      const refunded = orders.filter((o) => o.status === "refunded");
      return HttpResponse.json({
        paidCount: paid.length,
        paidRevenue: paid.reduce((sum, o) => sum + o.totalAmount, 0),
        refundedCount: refunded.length,
        refundedRevenue: refunded.reduce((sum, o) => sum + o.totalAmount, 0),
      });
    }),

    http.post(url("uploads/presign"), () =>
      HttpResponse.json({
        uploadUrl: `${base}/uploads/mock-object`,
        publicUrl: "https://mock.flick.dev/uploads/mock-object.png",
        key: "mock-object.png",
      }),
    ),
    http.put(
      url("uploads/mock-object"),
      () => new HttpResponse(null, { status: 200 }),
    ),

    http.post(url("refunds"), async ({ request }) => {
      const input = (await request.json()) as Record<string, unknown>;
      const orderId = String(input.orderId ?? "");
      const order = orders.find((o) => o.id === orderId);
      if (!order) {
        return errorResponse(404, "NOT_FOUND", "order not found");
      }
      return HttpResponse.json({
        id: randomId("refund"),
        orderId,
        amount: order.totalAmount,
        createdAt: nowIso(),
      });
    }),
  ];
}
