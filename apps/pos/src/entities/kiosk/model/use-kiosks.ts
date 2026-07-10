"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createKioskPairing,
  fetchBoothKiosks,
  revokeKiosk,
} from "../api/kiosk-api.ts";

export function useBoothKiosks(boothId: string) {
  return useQuery({
    queryKey: ["kiosks", boothId],
    queryFn: () => fetchBoothKiosks(boothId),
  });
}

export function useCreateKioskPairing(boothId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createKioskPairing(boothId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kiosks", boothId] }),
  });
}

export function useRevokeKiosk(boothId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (kioskId: string) => revokeKiosk(kioskId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kiosks", boothId] }),
  });
}
