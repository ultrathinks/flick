import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";
import { usePayByCode } from "../model/use-pay-by-code.tsx";

const QrScanner = lazy(() =>
  import("./qr-scanner.tsx").then((module) => ({ default: module.QrScanner })),
);

export const QrScannerHost = () => {
  const { scannerOpen, submitCode, closeScanner } = usePayByCode();

  return (
    <AnimatePresence>
      {scannerOpen && (
        <Suspense fallback={null}>
          <QrScanner onDetect={submitCode} onClose={closeScanner} />
        </Suspense>
      )}
    </AnimatePresence>
  );
};
