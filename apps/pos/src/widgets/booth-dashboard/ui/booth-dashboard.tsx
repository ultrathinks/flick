"use client";

import type { Booth } from "@/entities/booth";
import { useBoothProducts } from "@/entities/product";
import { Card } from "@/shared/ui";
import { AddProductForm } from "./add-product-form.tsx";
import { BoothStatusBanner } from "./booth-status-banner.tsx";
import { LogoutButton } from "./logout-button.tsx";
import { ProductCard } from "./product-card.tsx";

export function BoothDashboard({ booth }: { booth: Booth }) {
  const products = useBoothProducts(booth.id);

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{booth.name}</h1>
          <p className="text-sm text-zinc-500">메뉴 관리</p>
        </div>
        <LogoutButton />
      </header>

      <div className="mb-6">
        <BoothStatusBanner status={booth.status} />
      </div>

      <div className="space-y-2">
        {products.data?.map((product) => (
          <ProductCard key={product.id} product={product} boothId={booth.id} />
        ))}
        {products.data && products.data.length === 0 && (
          <Card className="text-center text-sm text-zinc-400">
            아직 등록한 메뉴가 없어요.
          </Card>
        )}
      </div>

      <div className="mt-4">
        <AddProductForm boothId={booth.id} />
      </div>
    </div>
  );
}
