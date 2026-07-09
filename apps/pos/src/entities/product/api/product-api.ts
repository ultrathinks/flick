import { z } from "zod";
import { request, requestVoid } from "@/shared/api";
import { type Product, productSchema } from "../model/types.ts";

export function fetchBoothProducts(boothId: string): Promise<Product[]> {
  return request(z.array(productSchema), `booths/${boothId}/products`);
}

export interface OptionValueInput {
  name: string;
  priceDelta?: number;
  isDefault?: boolean;
  sortOrder?: number;
}

export interface OptionGroupInput {
  name: string;
  required?: boolean;
  maxSelect?: number | null;
  sortOrder?: number;
  values: OptionValueInput[];
}

export interface ProductInput {
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  stock: number | null;
  status?: "available" | "soldout" | "hidden";
  sortOrder?: number;
  options?: OptionGroupInput[];
}

export function createProduct(
  boothId: string,
  input: ProductInput,
): Promise<Product> {
  return request(productSchema, `booths/${boothId}/products`, {
    method: "post",
    json: input,
  });
}

export function updateProduct(
  id: string,
  input: Partial<ProductInput>,
): Promise<Product> {
  return request(productSchema, `products/${id}`, {
    method: "patch",
    json: input,
  });
}

export function archiveProduct(id: string): Promise<void> {
  return requestVoid(`products/${id}`, { method: "delete" });
}
