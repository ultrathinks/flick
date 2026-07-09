import { AnimatePresence } from "framer-motion";
import { usePayByCode } from "../model/use-pay-by-code.tsx";
import { QrScanner } from "./qr-scanner.tsx";

export const QrScannerHost = () => {
  const { scannerOpen, submitCode, closeScanner } = usePayByCode();

  return (
    <AnimatePresence>
      {scannerOpen && (
        <QrScanner onDetect={submitCode} onClose={closeScanner} />
      )}
    </AnimatePresence>
  );
};
