"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/cn.ts";
import { resolveBank } from "../lib/bank.ts";

export function BankLogo({
  bankName,
  className,
}: {
  bankName: string;
  className?: string;
}) {
  const bank = resolveBank(bankName);
  const [failed, setFailed] = useState(false);
  const showImage = bank.code !== "unknown" && !failed;

  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full text-[0.625rem] font-semibold text-white",
        className,
      )}
      style={{ backgroundColor: bank.color }}
    >
      {showImage ? (
        // biome-ignore lint/performance/noImgElement: static local asset with graceful fallback, not remote content
        <img
          src={`/banks/${bank.code}.svg`}
          alt={bank.name}
          className="size-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden>{bank.short}</span>
      )}
    </span>
  );
}
