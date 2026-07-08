import {
  Actions,
  useBridgeProvider,
  useBridgeResponse,
} from "@b1nd/aid-kit/bridge-kit/web";
import { useRouter } from "@b1nd/aid-kit/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

function parseScanText(data: unknown): string | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const text = Reflect.get(data, "text");
  return typeof text === "string" && text.length > 0 ? text : null;
}

function hasNativeBridge(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(window.ReactNativeWebView) &&
    !window.__flickBridgeMock
  );
}

interface PayByCodeValue {
  scannerOpen: boolean;
  scan: () => void;
  closeScanner: () => void;
  submitCode: (code: string) => void;
}

const PayByCodeContext = createContext<PayByCodeValue | null>(null);

export function PayByCodeProvider({ children }: { children: ReactNode }) {
  const { send } = useBridgeProvider();
  const { stack } = useRouter();
  const [scannerOpen, setScannerOpen] = useState(false);

  const openPayment = useCallback(
    (code: string) => {
      const trimmed = code.trim();
      if (trimmed.length === 0) {
        return;
      }
      stack.push(`/payment/${encodeURIComponent(trimmed)}`);
    },
    [stack],
  );

  useBridgeResponse(Actions.QR_SCAN, async (data) => {
    const text = parseScanText(data);
    if (text) {
      openPayment(text);
    }
    return {};
  });

  const scan = useCallback(() => {
    if (hasNativeBridge()) {
      send(Actions.QR_SCAN);
      return;
    }
    setScannerOpen(true);
  }, [send]);

  const closeScanner = useCallback(() => setScannerOpen(false), []);

  const submitCode = useCallback(
    (code: string) => {
      setScannerOpen(false);
      openPayment(code);
    },
    [openPayment],
  );

  const value = useMemo(
    () => ({ scannerOpen, scan, closeScanner, submitCode }),
    [scannerOpen, scan, closeScanner, submitCode],
  );

  return (
    <PayByCodeContext.Provider value={value}>
      {children}
    </PayByCodeContext.Provider>
  );
}

export function usePayByCode(): PayByCodeValue {
  const value = useContext(PayByCodeContext);
  if (!value) {
    throw new Error("usePayByCode must be used within PayByCodeProvider");
  }
  return value;
}
