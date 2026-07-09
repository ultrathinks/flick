"use client";

import { useParams } from "next/navigation";
import type { Booth } from "@/entities/booth";
import { useBoothProducts } from "@/entities/product";
import { Button, EmptyState, Skeleton } from "@/shared/ui";
import { BoothScreen } from "@/widgets/app-shell";
import { ProductForm } from "@/widgets/product-form";

function EditProduct({ booth }: { booth: Booth }) {
  const params = useParams<{ id: string }>();
  const products = useBoothProducts(booth.id);

  if (products.isPending) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const product = products.data?.find((item) => item.id === params.id);

  if (!product) {
    return (
      <EmptyState
        emoji="🔍"
        title="메뉴를 찾을 수 없어요"
        description="이미 삭제되었거나 잘못된 주소예요."
        action={
          <Button variant="weak" size="sm" onClick={() => products.refetch()}>
            다시 불러오기
          </Button>
        }
      />
    );
  }

  return <ProductForm boothId={booth.id} product={product} />;
}

export default function EditProductPage() {
  return (
    <BoothScreen tab="menu">
      {(booth) => <EditProduct booth={booth} />}
    </BoothScreen>
  );
}
