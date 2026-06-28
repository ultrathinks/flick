"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOptionGroup,
  createOptionValue,
  deleteOptionGroup,
  deleteOptionValue,
  fetchProductOptions,
} from "../api/option-api.ts";

export function useProductOptions(productId: string | undefined) {
  return useQuery({
    queryKey: ["options", productId],
    queryFn: () => fetchProductOptions(productId as string),
    enabled: Boolean(productId),
  });
}

export function useOptionMutations(productId: string) {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["options", productId] });

  const addGroup = useMutation({
    mutationFn: (input: { name: string; required?: boolean }) =>
      createOptionGroup(productId, input),
    onSuccess: invalidate,
  });
  const removeGroup = useMutation({
    mutationFn: (groupId: string) => deleteOptionGroup(groupId),
    onSuccess: invalidate,
  });
  const addValue = useMutation({
    mutationFn: (params: {
      groupId: string;
      name: string;
      priceDelta?: number;
      isDefault?: boolean;
    }) =>
      createOptionValue(params.groupId, {
        name: params.name,
        priceDelta: params.priceDelta,
        isDefault: params.isDefault,
      }),
    onSuccess: invalidate,
  });
  const removeValue = useMutation({
    mutationFn: (valueId: string) => deleteOptionValue(valueId),
    onSuccess: invalidate,
  });

  return { addGroup, removeGroup, addValue, removeValue };
}
