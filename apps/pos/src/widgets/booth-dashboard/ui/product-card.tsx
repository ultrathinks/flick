"use client";

import { Settings2, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/entities/product";
import { useArchiveProduct, useUpdateProduct } from "@/entities/product";
import { cn } from "@/shared/lib/cn.ts";
import { Badge, Button, useConfirm, useToast } from "@/shared/ui";

export function ProductCard({
  product,
  boothId,
}: {
  product: Product;
  boothId: string;
}) {
  const update = useUpdateProduct(boothId);
  const archive = useArchiveProduct(boothId);
  const confirm = useConfirm();
  const toast = useToast();
  const soldOut = product.status === "hidden";

  const handleArchive = async () => {
    const ok = await confirm({
      title: "이 메뉴를 삭제할까요?",
      description: `‘${product.name}’ 메뉴가 목록에서 사라져요.`,
      confirmLabel: "삭제",
      tone: "danger",
    });
    if (!ok) return;
    archive.mutate(product.id, {
      onSuccess: () => toast.success("메뉴를 삭제했어요."),
      onError: () => toast.error("삭제에 실패했어요."),
    });
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-border bg-surface transition-colors hover:border-border">
      <div
        className={cn(
          "relative aspect-square bg-surface-muted",
          soldOut && "opacity-60",
        )}
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-body text-foreground-subtle">
            이미지 없음
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-body font-medium text-foreground">
            {product.name}
          </p>
          <Badge tone={soldOut ? "danger" : "success"}>
            {soldOut ? "품절" : "판매중"}
          </Badge>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-body font-medium tabular-nums text-foreground">
            {product.price.toLocaleString()}원
          </p>
          <p className="text-caption text-foreground-subtle">
            {product.stock === null ? "재고 무제한" : `재고 ${product.stock}`}
          </p>
        </div>

        <div className="mt-auto flex items-center gap-1 border-t border-border pt-2">
          <Link
            href={`/products/${product.id}/options`}
            className="inline-flex h-9 items-center gap-1.5 rounded-card-sm px-2.5 text-caption font-medium text-foreground-subtle transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <Settings2 className="size-4" />
            옵션
          </Link>
          <Button
            variant={soldOut ? "neutral" : "outline"}
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
            size="icon-sm"
            aria-label="메뉴 삭제"
            disabled={archive.isPending}
            onClick={handleArchive}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
