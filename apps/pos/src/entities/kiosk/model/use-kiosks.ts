"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createKioskPairing, fetchKioskPairings } from "../api/kiosk-api.ts";

export function useKioskPairings(boothId: string) {
  return useQuery({
    queryKey: ["kiosks", boothId],
    queryFn: () => fetchKioskPairings(boothId),
  });
}

export function useCreateKioskPairing(boothId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createKioskPairing(boothId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kiosks", boothId] }),
  });
}
