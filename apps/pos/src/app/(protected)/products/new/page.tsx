"use client";

import { BoothScreen } from "@/widgets/app-shell";
import { ProductForm } from "@/widgets/product-form";

export default function NewProductPage() {
  return (
    <BoothScreen tab="menu">
      {(booth) => <ProductForm boothId={booth.id} />}
    </BoothScreen>
  );
}
