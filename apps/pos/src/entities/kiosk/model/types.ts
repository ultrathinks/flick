import { z } from "zod";

export const kioskPairingSchema = z.object({
  id: z.string(),
  boothId: z.string(),
  kioskName: z.string(),
  expiresAt: z.string(),
  claimedAt: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.string(),
});

export type KioskPairing = z.infer<typeof kioskPairingSchema>;
