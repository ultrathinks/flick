import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect } from "react";
import { Button, Money } from "@/shared/ui";

const particles = Array.from({ length: 10 }, (_, index) => {
  const angle = (index / 10) * Math.PI * 2;
  const colors = ["bg-brand", "bg-success", "bg-warning", "bg-danger"];
  return {
    id: `particle-${index}`,
    x: Math.cos(angle) * 62,
    y: Math.sin(angle) * 62,
    color: colors[index % colors.length],
  };
});

interface PaymentCompleteProps {
  amount: number;
  onDone: () => void;
}

export const PaymentComplete = ({ amount, onDone }: PaymentCompleteProps) => {
  useEffect(() => {
    navigator.vibrate?.([12, 40, 24]);
  }, []);

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className="flex size-16 items-center justify-center rounded-full bg-brand text-brand-foreground"
          >
            <Check className="size-8" strokeWidth={3} aria-hidden />
          </motion.div>
          {particles.map((particle) => (
            <motion.span
              key={particle.id}
              className={`absolute top-1/2 left-1/2 size-2 rounded-full ${particle.color}`}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
              animate={{
                x: particle.x,
                y: particle.y,
                opacity: [0, 1, 0],
                scale: 1,
              }}
              transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            />
          ))}
        </div>
        <div className="space-y-1">
          <p className="text-title font-bold text-foreground">결제 완료</p>
          <Money amount={amount} className="text-body text-foreground-subtle" />
        </div>
      </div>
      <Button block size="lg" onClick={onDone}>
        확인
      </Button>
    </div>
  );
};
