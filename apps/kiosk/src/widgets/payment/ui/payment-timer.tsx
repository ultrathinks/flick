import { motion } from "framer-motion";
import { Timer } from "lucide-react";

type PaymentTimerProps = {
  remainingSeconds: number;
};

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${rest.toString().padStart(2, "0")}`;
}

export function PaymentTimer({ remainingSeconds }: PaymentTimerProps) {
  const isUrgent = remainingSeconds > 0 && remainingSeconds <= 60;
  const isExpired = remainingSeconds <= 0;

  if (isExpired) {
    return (
      <span className="rounded-full bg-danger-subtle px-3 py-1 text-body font-bold text-danger">
        만료됨
      </span>
    );
  }

  return (
    <motion.span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-body font-bold ${
        isUrgent
          ? "bg-danger-subtle text-danger"
          : "bg-surface-muted text-foreground-muted"
      }`}
      animate={isUrgent ? { opacity: [1, 0.6, 1] } : undefined}
      transition={
        isUrgent
          ? {
              duration: 0.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }
          : undefined
      }
    >
      <Timer className="size-4" strokeWidth={2} />
      {formatTimer(remainingSeconds)}
    </motion.span>
  );
}
