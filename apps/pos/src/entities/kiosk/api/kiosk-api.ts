import { z } from "zod";
import { request } from "@/shared/api";
import { type KioskPairing, kioskPairingSchema } from "../model/types.ts";

export function fetchKioskPairings(boothId: string): Promise<KioskPairing[]> {
  return request(z.array(kioskPairingSchema), `booths/${boothId}/kiosks`);
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
