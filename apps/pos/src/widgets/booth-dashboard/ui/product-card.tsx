"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Product } from "@/entities/product";
import { isStockSoldOut, productSaleState } from "@/entities/product";
import { cn } from "@/shared/lib/cn.ts";
import { Badge } from "@/shared/ui";

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const state = productSaleState(product);
  const stockSoldOut = isStockSoldOut(product);
  const optionCount = product.optionGroups.length;
  const onEdit = () => router.push(`/products/${product.id}/edit`);

  const stockCaption =
    product.stock === null
      ? "재고 무제한"
      : product.stock <= 0
        ? "재고 소진"
        : `재고 ${product.stock}개`;

  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={`${product.name} 수정`}
      className="flex flex-col overflow-hidden rounded-card border border-border bg-surface text-left outline-none transition-colors hover:border-brand/40 focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      <div className="relative aspect-square shrink-0 bg-surface-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-body text-foreground-subtle">
            이미지 없음
          </div>
        )}
        {state === "soldout" && (
          <div className="absolute inset-0 flex items-center justify-center bg-scrim">
            <span className="rounded-full bg-foreground px-3 py-1.5 text-body font-bold text-surface">
              품절
            </span>
          </div>
        )}
        {state === "hidden" && (
          <div className="absolute left-2 top-2">
            <Badge tone="neutral">숨김</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-body font-medium text-foreground">
            {product.name}
          </p>
          <Badge
            tone={
              state === "available"
                ? "success"
                : state === "soldout"
                  ? "danger"
                  : "neutral"
            }
          >
            {state === "available"
              ? "판매중"
              : state === "soldout"
                ? "품절"
                : "숨김"}
          </Badge>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-body font-medium tabular-nums text-foreground">
            {product.price.toLocaleString()}원
          </p>
          <p
            className={cn(
              "text-caption",
              stockSoldOut
                ? "font-medium text-danger"
                : "text-foreground-subtle",
            )}
          >
            {stockCaption}
          </p>
        </div>
        {optionCount > 0 && (
          <p className="text-caption text-foreground-subtle">
            옵션 {optionCount}개
          </p>
        )}
      </div>
    </button>
  );
}
