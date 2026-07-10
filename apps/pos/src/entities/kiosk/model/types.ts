import { z } from "zod";

export const kioskDeviceSchema = z.object({
  id: z.string(),
  boothId: z.string(),
  name: z.string(),
  lastSeenAt: z.string().nullable(),
  revokedAt: z.string().nullable(),
  createdAt: z.string(),
});

export type KioskDevice = z.infer<typeof kioskDeviceSchema>;

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

export const boothKiosksSchema = z.object({
  devices: z.array(kioskDeviceSchema),
  pending: z.array(kioskPairingSchema),
});

export type BoothKiosks = z.infer<typeof boothKiosksSchema>;

const PRESENCE_TTL_MS = 45 * 1000;

export function isKioskOnline(device: KioskDevice, now = Date.now()): boolean {
  if (device.lastSeenAt === null) {
    return false;
  }
  return now - new Date(device.lastSeenAt).getTime() <= PRESENCE_TTL_MS;
}
