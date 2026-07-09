import { useEffect, useState } from "react";
import { type PayoutAccount, useSavePayout } from "@/entities/payout";
import { isApiError } from "@/shared/api";
import { Button, Input, Select, useToast } from "@/shared/ui";
import { BANKS } from "../lib/banks.ts";

interface PayoutAccountFormProps {
  account: PayoutAccount | null;
  onSaved: () => void;
}

const DIGITS = /[^0-9]/g;

export const PayoutAccountForm = ({
  account,
  onSaved,
}: PayoutAccountFormProps) => {
  const toast = useToast();
  const save = useSavePayout();
  const [bankName, setBankName] = useState(account?.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(
    account?.accountNumber ?? "",
  );
  const [accountHolder, setAccountHolder] = useState(
    account?.accountHolder ?? "",
  );

  useEffect(() => {
    setBankName(account?.bankName ?? "");
    setAccountNumber(account?.accountNumber ?? "");
    setAccountHolder(account?.accountHolder ?? "");
  }, [account]);

  const canSubmit =
    bankName.trim().length > 0 &&
    accountNumber.trim().length > 0 &&
    accountHolder.trim().length > 0 &&
    !save.isPending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      return;
    }
    save.mutate(
      {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim(),
      },
      {
        onSuccess: () => {
          onSaved();
        },
        onError: (error) => {
          toast.error(
            isApiError(error)
              ? error.message
              : "저장하지 못했어요. 다시 시도해 주세요.",
          );
        },
      },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Select
        label="은행"
        value={bankName}
        onChange={(e) => setBankName(e.target.value)}
      >
        <option value="" disabled>
          은행을 선택하세요
        </option>
        {BANKS.map((bank) => (
          <option key={bank} value={bank}>
            {bank}
          </option>
        ))}
      </Select>

      <Input
        label="계좌번호"
        inputMode="numeric"
        placeholder="'-' 없이 숫자만 입력"
        value={accountNumber}
        onChange={(e) => setAccountNumber(e.target.value.replace(DIGITS, ""))}
        maxLength={64}
      />

      <Input
        label="예금주"
        placeholder="예금주 이름"
        value={accountHolder}
        onChange={(e) => setAccountHolder(e.target.value)}
        maxLength={64}
      />

      <Button type="submit" className="w-full" disabled={!canSubmit}>
        {save.isPending ? "저장 중…" : "저장하기"}
      </Button>
    </form>
  );
};
