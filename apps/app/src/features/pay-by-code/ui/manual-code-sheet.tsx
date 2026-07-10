import { motion } from "framer-motion";
import { X as XIcon } from "lucide-react";
import { useState } from "react";
import { Button, Icon, Input } from "@/shared/ui";

type ManualCodeSheetProps = {
  onSubmit: (code: string) => void;
  onClose: () => void;
};

export const ManualCodeSheet = ({
  onSubmit,
  onClose,
}: ManualCodeSheetProps) => {
  const [code, setCode] = useState("");

  const submit = () => {
    const trimmed = code.trim();
    if (trimmed.length > 0) {
      onSubmit(trimmed);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-bg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <header className="flex items-center justify-between px-5 py-4">
        <span className="text-heading font-semibold text-foreground">
          결제 코드 입력
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="-mr-2 inline-flex size-11 items-center justify-center rounded-full text-foreground-subtle transition-colors hover:bg-surface-muted active:scale-95"
        >
          <Icon icon={XIcon} size={24} />
        </button>
      </header>

      <div className="flex flex-1 flex-col justify-center gap-6 px-6 pb-16">
        <div className="space-y-2 text-center">
          <p className="text-title font-bold text-foreground">
            결제 코드를 입력해 주세요
          </p>
          <p className="text-body text-foreground-subtle">
            키오스크 화면에 표시된 6자리 코드를 입력하면 결제할 수 있어요.
          </p>
        </div>
        <div className="space-y-3">
          <Input
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                submit();
              }
            }}
            placeholder="000000"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            className="text-center text-title tracking-[0.4em] tabular-nums"
          />
          <Button
            block
            size="lg"
            onClick={submit}
            disabled={code.trim().length === 0}
          >
            결제하기
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
