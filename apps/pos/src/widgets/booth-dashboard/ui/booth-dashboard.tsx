"use client";

import { Plus, UtensilsCrossed } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Booth } from "@/entities/booth";
import { useBoothProducts } from "@/entities/product";
import { Button, EmptyState, Page, QueryState, Skeleton } from "@/shared/ui";
import { ProductCard } from "./product-card.tsx";

function AddButton() {
  const router = useRouter();
  return (
    <Button onClick={() => router.push("/products/new")}>
      <Plus className="size-4" />
      메뉴 추가
    </Button>
  );
}

export function BoothDashboard({ booth }: { booth: Booth }) {
  const products = useBoothProducts(booth.id);
  const count = products.data?.length ?? 0;

  return (
    <Page title="메뉴 관리" actions={<AddButton />}>
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
            action={<AddButton />}
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
    </Page>
  );
}
