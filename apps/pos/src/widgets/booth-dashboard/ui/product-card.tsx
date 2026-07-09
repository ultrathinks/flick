"use client";

import { EyeOff, MoreVertical, Pencil, Play, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Product } from "@/entities/product";
import {
  isStockSoldOut,
  productSaleState,
  useArchiveProduct,
  useUpdateProduct,
} from "@/entities/product";
import { cn } from "@/shared/lib/cn.ts";
import {
  Badge,
  Button,
  Menu,
  MenuItem,
  useConfirm,
  useToast,
} from "@/shared/ui";

export function ProductCard({
  product,
  boothId,
}: {
  product: Product;
  boothId: string;
}) {
  const router = useRouter();
  const update = useUpdateProduct(boothId);
  const archive = useArchiveProduct(boothId);
  const confirm = useConfirm();
  const toast = useToast();
  const state = productSaleState(product);
  const stockSoldOut = isStockSoldOut(product);
  const optionCount = product.optionGroups.length;
  const onEdit = () => router.push(`/products/${product.id}/edit`);

  const setStatus = (
    status: "available" | "soldout" | "hidden",
    message: string,
  ) => {
    update.mutate(
      { id: product.id, input: { status } },
      {
        onSuccess: () => toast.success(message),
        onError: () => toast.error("변경에 실패했어요."),
      },
    );
  };

  const handleArchive = async () => {
    const ok = await confirm({
      title: "이 메뉴를 삭제할까요?",
      description: `‘${product.name}’ 메뉴가 목록에서 완전히 사라져요.`,
      confirmLabel: "삭제",
      tone: "danger",
    });
    if (!ok) return;
    archive.mutate(product.id, {
      onSuccess: () => toast.success("메뉴를 삭제했어요."),
      onError: () => toast.error("삭제에 실패했어요."),
    });
  };

  const stockCaption =
    product.stock === null
      ? "재고 무제한"
      : product.stock <= 0
        ? "재고 소진"
        : `재고 ${product.stock}개`;

  return (
    <article className="flex flex-col overflow-hidden rounded-card border border-border bg-surface">
      <button
        type="button"
        className="block text-left outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        onClick={onEdit}
        aria-label={`${product.name} 수정`}
      >
        <div className="relative aspect-square bg-surface-muted">
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
      </button>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <button
          type="button"
          className="flex items-start justify-between gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          onClick={onEdit}
        >
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
        </button>
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

        <div className="mt-auto flex items-center gap-2 border-t border-border pt-2">
          <StatusAction
            state={state}
            stockSoldOut={stockSoldOut}
            pending={update.isPending}
            onResume={() => setStatus("available", "판매를 시작했어요.")}
            onSoldOut={() => setStatus("soldout", "품절로 표시했어요.")}
            onEdit={onEdit}
          />
          <Menu
            trigger={({ toggle, triggerProps }) => (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="더보기"
                onClick={toggle}
                {...triggerProps}
              >
                <MoreVertical className="size-4" />
              </Button>
            )}
          >
            <MenuItem icon={<Pencil />} onClick={onEdit}>
              메뉴 수정
            </MenuItem>
            {state !== "hidden" && (
              <MenuItem
                icon={<EyeOff />}
                onClick={() => setStatus("hidden", "메뉴를 숨겼어요.")}
              >
                메뉴 숨기기
              </MenuItem>
            )}
            <MenuItem tone="danger" icon={<Trash2 />} onClick={handleArchive}>
              삭제
            </MenuItem>
          </Menu>
        </div>
      </div>
    </article>
  );
}

function StatusAction({
  state,
  stockSoldOut,
  pending,
  onResume,
  onSoldOut,
  onEdit,
}: {
  state: "available" | "soldout" | "hidden";
  stockSoldOut: boolean;
  pending: boolean;
  onResume: () => void;
  onSoldOut: () => void;
  onEdit: () => void;
}) {
  if (state === "hidden") {
    return (
      <Button
        variant="fill"
        size="sm"
        className="flex-1"
        disabled={pending}
        onClick={onResume}
      >
        <Play className="size-4" />
        판매 시작
      </Button>
    );
  }
  if (state === "soldout") {
    if (stockSoldOut) {
      return (
        <Button variant="fill" size="sm" className="flex-1" onClick={onEdit}>
          재고 추가
        </Button>
      );
    }
    return (
      <Button
        variant="fill"
        size="sm"
        className="flex-1"
        disabled={pending}
        onClick={onResume}
      >
        <Play className="size-4" />
        판매 재개
      </Button>
    );
  }
  return (
    <Button
      variant="outline"
      size="sm"
      className="flex-1"
      disabled={pending}
      onClick={onSoldOut}
    >
      품절 처리
    </Button>
  );
}
