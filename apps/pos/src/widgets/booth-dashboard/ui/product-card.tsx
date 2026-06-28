"use client";

import Link from "next/link";
import type { Product } from "@/entities/product";
import { useArchiveProduct, useUpdateProduct } from "@/entities/product";
import { Button, Card } from "@/shared/ui";

export function ProductCard({
  product,
  boothId,
}: {
  product: Product;
  boothId: string;
}) {
  const update = useUpdateProduct(boothId);
  const archive = useArchiveProduct(boothId);
  const soldOut = product.status === "hidden";

  return (
    <Card className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-zinc-900">
          {product.name}
        </p>
        <p className="text-xs text-zinc-500">
          {product.price.toLocaleString()}원 ·{" "}
          {product.stock === null ? "재고 무제한" : `재고 ${product.stock}`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/products/${product.id}/options`}
          className="rounded-lg px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-800"
        >
          옵션
        </Link>
        <Button
          variant={soldOut ? "secondary" : "danger"}
          className="text-xs"
          disabled={update.isPending}
          onClick={() =>
            update.mutate({
              id: product.id,
              input: { status: soldOut ? "available" : "hidden" },
            })
          }
        >
          {soldOut ? "판매 재개" : "품절"}
        </Button>
        <Button
          variant="ghost"
          className="text-xs"
          disabled={archive.isPending}
          onClick={() => {
            if (confirm("이 메뉴를 삭제할까요?")) {
              archive.mutate(product.id);
            }
          }}
        >
          삭제
        </Button>
      </div>
    </Card>
  );
}
