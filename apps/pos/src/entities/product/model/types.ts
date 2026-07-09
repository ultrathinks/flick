import { z } from "zod";
import { optionGroupSchema } from "@/entities/option";

export const productSchema = z.object({
  id: z.string(),
  boothId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  price: z.number(),
  stock: z.number().nullable(),
  status: z.enum(["available", "soldout", "hidden"]),
  sortOrder: z.number(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  optionGroups: z.array(optionGroupSchema).default([]),
});

export type Product = z.infer<typeof productSchema>;

export type ProductSaleState = "available" | "soldout" | "hidden";

export function productSaleState(product: Product): ProductSaleState {
  if (product.status === "hidden") {
    return "hidden";
  }
  if (
    product.status === "soldout" ||
    (product.stock !== null && product.stock <= 0)
  ) {
    return "soldout";
  }
  return "available";
}

export function isStockSoldOut(product: Product): boolean {
  return (
    product.status !== "soldout" && product.stock !== null && product.stock <= 0
  );
}
