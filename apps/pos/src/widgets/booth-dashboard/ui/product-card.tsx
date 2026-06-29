"use client";

import { Settings2, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/entities/product";
import { useArchiveProduct, useUpdateProduct } from "@/entities/product";
import { Badge, Button } from "@/shared/ui";

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
    <div className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface transition-colors hover:border-muted/40">
      <div className="relative aspect-square bg-surface-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            이미지 없음
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-medium text-foreground">
            {product.name}
          </p>
          <Badge tone={soldOut ? "danger" : "success"}>
            {soldOut ? "품절" : "판매중"}
          </Badge>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium tabular-nums text-foreground">
            {product.price.toLocaleString()}원
          </p>
          <p className="text-xs text-muted">
            {product.stock === null ? "재고 무제한" : `재고 ${product.stock}`}
          </p>
        </div>

        <div className="mt-auto flex items-center gap-1 border-t border-border pt-2">
          <Link
            href={`/products/${product.id}/options`}
            className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-card-sm)] px-2.5 text-xs font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <Settings2 className="size-3.5" />
            옵션
          </Link>
          <Button
            variant={soldOut ? "secondary" : "outline"}
            size="sm"
            className="ml-auto"
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
            size="sm"
            className="px-2"
            aria-label="메뉴 삭제"
            disabled={archive.isPending}
            onClick={() => {
              if (confirm("이 메뉴를 삭제할까요?")) {
                archive.mutate(product.id);
              }
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
