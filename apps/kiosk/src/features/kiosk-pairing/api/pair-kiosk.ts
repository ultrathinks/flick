import { apiRequest } from "@/shared/api/client";
import type { Booth, Kiosk } from "@/shared/api/types";

export function pairKiosk(code: string) {
  return apiRequest<{ kiosk: Kiosk; deviceToken: string }>("/kiosks/pair", {
    method: "POST",
    body: { code },
  });
}

export function getCurrentKiosk(token: string) {
  return apiRequest<{ kiosk: Kiosk; booth: Booth }>("/kiosks/me", { token });
}

export function unpairKiosk(token: string) {
  return apiRequest<void>("/kiosks/me/unpair", { method: "POST", token });
}
