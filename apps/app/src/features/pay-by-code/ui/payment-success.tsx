import { motion } from "framer-motion";
import { Button, Money } from "@/shared/ui";

interface PaymentSuccessProps {
  amount: number;
  boothName: string;
  onDone: () => void;
}

export const PaymentSuccess = ({
  amount,
  boothName,
  onDone,
}: PaymentSuccessProps) => (
  <div className="pt-2">
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="flex size-[72px] items-center justify-center rounded-full bg-success text-success-foreground"
      >
        <motion.svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-9"
          aria-hidden
        >
          <motion.path
            d="M20 6 9 17l-5-5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          />
        </motion.svg>
      </motion.div>
      <div className="space-y-1">
        <p className="text-title font-bold text-foreground">결제 완료</p>
        <div className="text-body text-foreground-subtle">
          {boothName} ·{" "}
          <Money amount={amount} className="text-foreground-subtle" />
        </div>
      </div>
    </div>
    <Button block size="lg" onClick={onDone}>
      확인
    </Button>
  </div>
);
