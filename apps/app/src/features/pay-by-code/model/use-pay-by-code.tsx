import {
  Actions,
  useBridgeProvider,
  useBridgeResponse,
} from "@b1nd/aid-kit/bridge-kit/web";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useToast } from "@/shared/ui";

interface QrScanResponse {
  error?: string;
  data?: { value?: unknown };
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
  manualOpen: boolean;
  activeCode: string | null;
  scan: () => void;
  closeScanner: () => void;
  enterCode: () => void;
  closeManual: () => void;
  submitCode: (code: string) => void;
  closePayment: () => void;
  rescan: () => void;
}

const PayByCodeContext = createContext<PayByCodeValue | null>(null);

export function PayByCodeProvider({ children }: { children: ReactNode }) {
  const { send } = useBridgeProvider();
  const toast = useToast();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [activeCode, setActiveCode] = useState<string | null>(null);

  const openPayment = useCallback((code: string) => {
    const trimmed = code.trim();
    if (trimmed.length > 0) {
      setActiveCode(trimmed);
    }
  }, []);

  useBridgeResponse(Actions.QR_SCAN, async (response) => {
    const result = response as QrScanResponse | null;
    const value = result?.data?.value;
    if (typeof value === "string" && value.length > 0) {
      openPayment(value);
    } else if (result?.error !== "CANCELLED") {
      toast.error("QR을 인식하지 못했어요. 다시 시도해 주세요.");
    }
    return {};
  });

  const scan = useCallback(() => {
    send(Actions.HAPTIC, { style: "light" });
    if (hasNativeBridge()) {
      send(Actions.QR_SCAN);
      return;
    }
    setScannerOpen(true);
  }, [send]);

  const closeScanner = useCallback(() => setScannerOpen(false), []);

  const enterCode = useCallback(() => {
    send(Actions.HAPTIC, { style: "light" });
    setManualOpen(true);
  }, [send]);

  const closeManual = useCallback(() => setManualOpen(false), []);

  const submitCode = useCallback(
    (code: string) => {
      setScannerOpen(false);
      setManualOpen(false);
      openPayment(code);
    },
    [openPayment],
  );

  const closePayment = useCallback(() => setActiveCode(null), []);

  const rescan = useCallback(() => {
    setActiveCode(null);
    scan();
  }, [scan]);

  const value = useMemo(
    () => ({
      scannerOpen,
      manualOpen,
      activeCode,
      scan,
      closeScanner,
      enterCode,
      closeManual,
      submitCode,
      closePayment,
      rescan,
    }),
    [
      scannerOpen,
      manualOpen,
      activeCode,
      scan,
      closeScanner,
      enterCode,
      closeManual,
      submitCode,
      closePayment,
      rescan,
    ],
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
