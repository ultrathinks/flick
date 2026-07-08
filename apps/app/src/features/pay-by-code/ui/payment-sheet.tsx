import { useRouter } from "@b1nd/aid-kit/navigation";
import { AlertCircleIcon, XIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import {
  EXPIRED_PAYMENT_INFO,
  type PaymentErrorInfo,
  paymentErrorInfo,
  usePaymentCodeView,
} from "@/entities/payment";
import { formatSeconds, useCountdown } from "@/shared/lib";
import { Button, Icon, Money, Spinner } from "@/shared/ui";
import { useConfirmPayment } from "../model/use-confirm-payment.ts";
import { usePayByCode } from "../model/use-pay-by-code.tsx";
import { PaymentSuccess } from "./payment-success.tsx";
import { SlideToPay } from "./slide-to-pay.tsx";

const Sheet = ({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) => (
  <div className="fixed inset-0 z-50 flex flex-col justify-end">
    <button
      type="button"
      aria-label="닫기"
      tabIndex={-1}
      className="absolute inset-0 animate-scrim-in bg-scrim"
      onClick={onClose}
    />
    <div
      role="dialog"
      aria-modal="true"
      className="relative z-10 animate-sheet-in rounded-t-sheet bg-surface px-6 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-3 shadow-[var(--shadow-overlay)]"
    >
      <div className="mx-auto mb-2 h-1.5 w-9 rounded-full bg-border" />
      {children}
    </div>
  </div>
);

const ErrorBody = ({
  info,
  onRescan,
  onCharge,
  onClose,
}: {
  info: PaymentErrorInfo;
  onRescan: () => void;
  onCharge: () => void;
  onClose: () => void;
}) => (
  <div className="pt-2">
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-surface-muted text-foreground-subtle">
        <Icon icon={AlertCircleIcon} size={28} />
      </div>
      <div className="space-y-1">
        <p className="text-heading font-bold text-foreground">{info.title}</p>
        <p className="text-body text-foreground-subtle">{info.description}</p>
      </div>
    </div>
    <Button
      block
      size="lg"
      onClick={
        info.action === "charge"
          ? onCharge
          : info.action === "rescan"
            ? onRescan
            : onClose
      }
    >
      {info.action === "charge"
        ? "충전하기"
        : info.action === "rescan"
          ? "다시 스캔하기"
          : "닫기"}
    </Button>
  </div>
);

const PaymentFlow = ({ code }: { code: string }) => {
  const { closePayment, rescan } = usePayByCode();
  const { stack } = useRouter();
  const view = usePaymentCodeView(code);
  const confirm = useConfirmPayment(code);
  const [paid, setPaid] = useState(false);

  const goCharge = () => {
    closePayment();
    stack.push("/my-code");
  };

  const expiresAt = view.data
    ? new Date(view.data.payment.expiresAt).getTime()
    : null;
  const remaining = useCountdown(expiresAt);
  const expired = expiresAt !== null && remaining <= 0;

  if (paid && view.data) {
    return (
      <PaymentSuccess
        amount={view.data.order.totalAmount}
        boothName={view.data.booth.name}
        onDone={closePayment}
      />
    );
  }

  if (view.isPending) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (view.isError) {
    return (
      <ErrorBody
        info={paymentErrorInfo(view.error)}
        onRescan={rescan}
        onCharge={goCharge}
        onClose={closePayment}
      />
    );
  }

  const info = confirm.error ? paymentErrorInfo(confirm.error) : null;
  if (info) {
    return (
      <ErrorBody
        info={info}
        onRescan={rescan}
        onCharge={goCharge}
        onClose={closePayment}
      />
    );
  }

  if (expired) {
    return (
      <ErrorBody
        info={EXPIRED_PAYMENT_INFO}
        onRescan={rescan}
        onCharge={goCharge}
        onClose={closePayment}
      />
    );
  }

  const { booth, items, order, balance } = view.data;
  const notEnough = balance < order.totalAmount;

  return (
    <div>
      <div className="flex items-center gap-2 pt-1">
        <p className="min-w-0 flex-1 truncate text-heading font-semibold text-foreground">
          {booth.name}
        </p>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-caption font-medium tabular-nums text-foreground-subtle">
          <span className="size-1.5 rounded-full bg-success" />
          {formatSeconds(remaining)}
        </span>
      </div>

      <div className="py-6 text-center">
        <p className="mb-1.5 text-caption text-foreground-subtle">결제 금액</p>
        <Money
          amount={order.totalAmount}
          className="text-display font-bold text-foreground"
        />
      </div>

      <ul className="space-y-2 border-t border-border pt-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-baseline justify-between gap-3 text-body"
          >
            <span className="min-w-0 flex-1 truncate text-foreground-muted">
              {item.name} × {item.quantity}
            </span>
            <Money
              amount={item.totalAmount}
              className="shrink-0 text-foreground"
            />
          </li>
        ))}
        <li className="flex justify-between pt-1 text-caption text-foreground-subtle">
          <span>결제 후 잔액</span>
          <Money
            amount={balance - order.totalAmount}
            className="text-foreground-subtle"
          />
        </li>
      </ul>

      {notEnough ? (
        <Button block size="lg" className="mt-5" onClick={goCharge}>
          잔액이 부족해요 · 충전하기
        </Button>
      ) : (
        <div className="mt-5">
          <SlideToPay
            disabled={confirm.isPending}
            onConfirm={() =>
              confirm.mutate(undefined, { onSuccess: () => setPaid(true) })
            }
          />
        </div>
      )}
    </div>
  );
};

export const PaymentSheetHost = () => {
  const { activeCode, closePayment } = usePayByCode();

  if (!activeCode) {
    return null;
  }

  return (
    <Sheet onClose={closePayment}>
      <button
        type="button"
        onClick={closePayment}
        aria-label="닫기"
        className="absolute right-4 top-3 inline-flex size-9 items-center justify-center rounded-full text-foreground-subtle transition-colors hover:bg-surface-muted"
      >
        <Icon icon={XIcon} size={20} />
      </button>
      <PaymentFlow code={activeCode} />
    </Sheet>
  );
};
