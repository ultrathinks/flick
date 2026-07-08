import { usePayByCode } from "../model/use-pay-by-code.tsx";
import { QrScanner } from "./qr-scanner.tsx";

export const QrScannerHost = () => {
  const { scannerOpen, submitCode, closeScanner } = usePayByCode();

  if (!scannerOpen) {
    return null;
  }

  return <QrScanner onDetect={submitCode} onClose={closeScanner} />;
};
