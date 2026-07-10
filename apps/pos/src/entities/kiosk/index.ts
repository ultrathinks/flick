export {
  type CreatePairingResult,
  createKioskPairing,
  fetchBoothKiosks,
  revokeKiosk,
} from "./api/kiosk-api.ts";
export {
  type BoothKiosks,
  boothKiosksSchema,
  isKioskOnline,
  type KioskDevice,
  type KioskPairing,
  kioskDeviceSchema,
  kioskPairingSchema,
} from "./model/types.ts";
export {
  useBoothKiosks,
  useCreateKioskPairing,
  useRevokeKiosk,
} from "./model/use-kiosks.ts";
