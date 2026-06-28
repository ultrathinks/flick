"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  archiveProduct,
  createProduct,
  fetchBoothProducts,
  type ProductInput,
  updateProduct,
} from "../api/product-api.ts";

export function useBoothProducts(boothId: string | undefined) {
  return useQuery({
    queryKey: ["products", boothId],
    queryFn: () => fetchBoothProducts(boothId as string),
    enabled: Boolean(boothId),
  });
}

export function useCreateProduct(boothId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) => createProduct(boothId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products", boothId] }),
  });
}

export function useUpdateProduct(boothId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; input: Partial<ProductInput> }) =>
      updateProduct(params.id, params.input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products", boothId] }),
  });
}

export function useArchiveProduct(boothId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products", boothId] }),
  });
}
