import {
  Actions,
  useBridgeProvider,
  useBridgeResponse,
} from "@b1nd/aid-kit/bridge-kit/web";
import { useCallback } from "react";
import { useToast } from "@/shared/ui";

interface QrScanResponse {
  error?: string;
  data?: { value?: unknown };
}

export function hasNativeQrScan(): boolean {
  return typeof window !== "undefined" && !!window.ReactNativeWebView;
}

export function useQrScan(onDetect: (code: string) => void) {
  const { send } = useBridgeProvider();
  const toast = useToast();

  useBridgeResponse(Actions.QR_SCAN, async (response) => {
    const result = response as QrScanResponse | null;
    const value = result?.data?.value;
    if (typeof value === "string" && value.length > 0) {
      onDetect(value);
    } else if (result?.error !== "CANCELLED") {
      toast.error("QR을 인식하지 못했어요. 다시 시도해 주세요.");
    }
    return {};
  });

  const startNative = useCallback(() => {
    send(Actions.QR_SCAN);
  }, [send]);

  return { nativeAvailable: hasNativeQrScan(), startNative };
}
