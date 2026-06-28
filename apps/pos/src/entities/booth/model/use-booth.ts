"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type BoothInput,
  createBooth,
  fetchBooths,
  updateBooth,
} from "../api/booth-api.ts";

export function useMyBooth() {
  return useQuery({
    queryKey: ["booths"],
    queryFn: fetchBooths,
    select: (booths) => booths[0] ?? null,
  });
}

export function useCreateBooth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BoothInput) => createBooth(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booths"] }),
  });
}

export function useUpdateBooth(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<BoothInput>) => updateBooth(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booths"] }),
  });
}
