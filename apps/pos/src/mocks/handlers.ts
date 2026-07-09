import { HttpResponse, http } from "msw";
import {
  booth,
  kioskPairings,
  me,
  optionGroups,
  orders,
  products,
} from "./fixtures.ts";

function errorResponse(status: number, code: string, message: string) {
  return HttpResponse.json({ error: { code, message } }, { status });
}

function nowIso(): string {
  return new Date().toISOString();
}

function randomId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
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
      return HttpResponse.json({
        id: randomId("product"),
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
      });
    }),
    http.patch(url("products/:id"), async ({ params, request }) => {
      const input = (await request.json()) as Record<string, unknown>;
      const target = products.find((p) => p.id === params.id) ?? products[0];
      return HttpResponse.json({
        ...target,
        ...input,
        id: String(params.id),
        updatedAt: nowIso(),
      });
    }),
    http.delete(
      url("products/:id"),
      () => new HttpResponse(null, { status: 204 }),
    ),

    http.get(url("products/:productId/options"), () =>
      HttpResponse.json(optionGroups),
    ),
    http.post(
      url("products/:productId/option-groups"),
      async ({ params, request }) => {
        const input = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: randomId("group"),
          productId: String(params.productId),
          name: String(input.name ?? ""),
          required: Boolean(input.required ?? false),
          sortOrder: Number(input.sortOrder ?? 0),
          archivedAt: null,
          createdAt: nowIso(),
        });
      },
    ),
    http.delete(
      url("option-groups/:groupId"),
      () => new HttpResponse(null, { status: 204 }),
    ),
    http.post(
      url("option-groups/:groupId/values"),
      async ({ params, request }) => {
        const input = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: randomId("value"),
          groupId: String(params.groupId),
          name: String(input.name ?? ""),
          priceDelta: Number(input.priceDelta ?? 0),
          isDefault: Boolean(input.isDefault ?? false),
          sortOrder: Number(input.sortOrder ?? 0),
          archivedAt: null,
          createdAt: nowIso(),
        });
      },
    ),
    http.delete(
      url("option-values/:valueId"),
      () => new HttpResponse(null, { status: 204 }),
    ),

    http.get(url("booths/:boothId/kiosks"), () =>
      HttpResponse.json(kioskPairings),
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
      return HttpResponse.json({ pairing, code: "PAIR-CODE" });
    }),

    http.get(url("booths/:boothId/orders"), () => HttpResponse.json(orders)),

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
