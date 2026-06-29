import { motion } from "framer-motion";

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
      <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-600">
        만료됨
      </span>
    );
  }

  return (
    <motion.span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${
        isUrgent ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-700"
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
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <title>timer</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z"
        />
      </svg>
      {formatTimer(remainingSeconds)}
    </motion.span>
  );
}
