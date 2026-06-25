import {
  Actions,
  useBridgeProvider,
  useBridgeResponse,
} from "@b1nd/aid-kit/bridge-kit/web";
import { useRouter } from "@b1nd/aid-kit/navigation";
import { useState } from "react";

function parseScanText(data: unknown): string | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const text = Reflect.get(data, "text");
  return typeof text === "string" && text.length > 0 ? text : null;
}

export function usePayByCode() {
  const { send } = useBridgeProvider();
  const { stack } = useRouter();
  const [manualCode, setManualCode] = useState("");

  const openPayment = (code: string) => {
    const trimmed = code.trim();
    if (trimmed.length === 0) {
      return;
    }
    stack.push(`/payment/${encodeURIComponent(trimmed)}`);
  };

  useBridgeResponse(Actions.QR_SCAN, async (data) => {
    const text = parseScanText(data);
    if (text) {
      openPayment(text);
    }
    return {};
  });

  const scan = () => send(Actions.QR_SCAN);
  const submitManual = () => openPayment(manualCode);

  return { manualCode, setManualCode, scan, submitManual };
}
