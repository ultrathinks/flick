import { z } from "zod";
import { request } from "@/shared/api";
import {
  type BoothKiosks,
  boothKiosksSchema,
  type KioskDevice,
  type KioskPairing,
  kioskDeviceSchema,
  kioskPairingSchema,
} from "../model/types.ts";

export function fetchBoothKiosks(boothId: string): Promise<BoothKiosks> {
  return request(boothKiosksSchema, `booths/${boothId}/kiosks`);
}

const createPairingResponseSchema = z.object({
  pairing: kioskPairingSchema,
  code: z.string(),
});

export type CreatePairingResult = z.infer<typeof createPairingResponseSchema>;

export function createKioskPairing(
  boothId: string,
  name: string,
): Promise<CreatePairingResult> {
  return request(createPairingResponseSchema, `booths/${boothId}/kiosks`, {
    method: "post",
    json: { name },
  });
}

export function revokeKiosk(kioskId: string): Promise<KioskDevice> {
  return request(kioskDeviceSchema, `kiosks/${kioskId}/revoke`, {
    method: "post",
  });
}

export type { KioskDevice, KioskPairing };
