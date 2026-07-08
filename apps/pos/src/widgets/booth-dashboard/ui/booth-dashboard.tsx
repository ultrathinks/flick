"use client";

import { UtensilsCrossed } from "lucide-react";
import type { Booth } from "@/entities/booth";
import { useBoothProducts } from "@/entities/product";
import { EmptyState, QueryState, Skeleton } from "@/shared/ui";
import { ProductCard } from "./product-card.tsx";

export function BoothDashboard({ booth }: { booth: Booth }) {
  const products = useBoothProducts(booth.id);
  const count = products.data?.length ?? 0;

  return (
    <div className="space-y-5">
      <QueryState
        isPending={products.isPending}
        isError={products.isError}
        isEmpty={count === 0}
        onRetry={() => products.refetch()}
        loading={
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
        empty={
          <EmptyState
            icon={<UtensilsCrossed />}
            title="아직 등록한 메뉴가 없어요"
            description="첫 메뉴를 추가해 판매를 시작하세요."
          />
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {(products.data ?? []).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              boothId={booth.id}
            />
          ))}
        </div>
      </QueryState>
    </div>
  );
}
