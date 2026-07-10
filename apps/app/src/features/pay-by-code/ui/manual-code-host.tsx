import { AnimatePresence } from "framer-motion";
import { usePayByCode } from "../model/use-pay-by-code.tsx";
import { ManualCodeSheet } from "./manual-code-sheet.tsx";

export const ManualCodeHost = () => {
  const { manualOpen, submitCode, closeManual } = usePayByCode();

  return (
    <AnimatePresence>
      {manualOpen && (
        <ManualCodeSheet onSubmit={submitCode} onClose={closeManual} />
      )}
    </AnimatePresence>
  );
};
