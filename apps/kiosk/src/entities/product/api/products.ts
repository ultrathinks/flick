import { apiRequest } from "@/shared/api/client";
import type { Product } from "@/shared/api/types";

export function getKioskProducts(token: string) {
  return apiRequest<Product[]>("/kiosks/me/products", { token });
}
