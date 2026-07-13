import {
  Actions,
  useBridgeProvider,
  useBridgeResponse,
} from "@b1nd/aid-kit/bridge-kit/web";
import { useCallback } from "react";

function extractQrText(data: unknown): string | null {
  if (typeof data === "string") {
    return data.trim() || null;
  }
  if (typeof data !== "object" || data === null) {
    return null;
  }
  for (const key of ["text", "data", "value", "result", "code"]) {
    const value = Reflect.get(data, key);
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

export function hasNativeQrScan(): boolean {
  return typeof window !== "undefined" && !!window.ReactNativeWebView;
}

export function useQrScan(onDetect: (code: string) => void) {
  const { send } = useBridgeProvider();

  useBridgeResponse(Actions.QR_SCAN, async (data) => {
    const code = extractQrText(data);
    if (code) {
      onDetect(code);
    }
    return {};
  });

  const startNative = useCallback(() => {
    send(Actions.QR_SCAN);
  }, [send]);

  return { nativeAvailable: hasNativeQrScan(), startNative };
}
