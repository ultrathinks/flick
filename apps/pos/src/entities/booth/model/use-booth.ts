"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type BoothInput,
  createBooth,
  fetchMyBooth,
  updateBooth,
} from "../api/booth-api.ts";

export function useMyBooth() {
  return useQuery({
    queryKey: ["my-booth"],
    queryFn: fetchMyBooth,
  });
}

export function useCreateBooth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BoothInput) => createBooth(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-booth"] }),
  });
}

export function useUpdateBooth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<BoothInput>) => updateBooth(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-booth"] }),
  });
}
