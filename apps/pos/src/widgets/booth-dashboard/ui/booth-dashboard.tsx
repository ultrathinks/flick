"use client";

import { UtensilsCrossed } from "lucide-react";
import type { Booth } from "@/entities/booth";
import { useBoothProducts } from "@/entities/product";
import { EmptyState, Skeleton } from "@/shared/ui";
import { AddProductForm } from "./add-product-form.tsx";
import { ProductCard } from "./product-card.tsx";

export function BoothDashboard({ booth }: { booth: Booth }) {
  const products = useBoothProducts(booth.id);
  const count = products.data?.length ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            메뉴 관리
          </h1>
          {count > 0 && (
            <span className="text-sm text-foreground-subtle">{count}</span>
          )}
        </div>
        <AddProductForm boothId={booth.id} />
      </div>

      {products.isPending ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : products.data && products.data.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {products.data.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              boothId={booth.id}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<UtensilsCrossed />}
          title="아직 등록한 메뉴가 없어요"
          description="첫 메뉴를 추가해 판매를 시작하세요."
        />
      )}
    </div>
  );
}
