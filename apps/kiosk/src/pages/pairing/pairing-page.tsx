import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { pairKiosk } from "@/features/kiosk-pairing/api/pair-kiosk";
import { ApiError } from "@/shared/api";
import {
  clearCartItems,
  clearPaymentSnapshot,
  setKioskToken,
} from "@/shared/model/storage";
import { PairingForm } from "@/widgets/pairing/ui/pairing-form";

function getPairingErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return "페어링 코드가 올바르지 않거나 만료되었습니다";
    }
    if (error.status === 429) {
      return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요";
    }
    return error.message;
  }
  return "서버에 연결할 수 없습니다";
}

export function PairingPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPairing, setIsPairing] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const pairingCode = code.trim();
    if (!pairingCode || isPairing) {
      return;
    }

    setIsPairing(true);
    setErrorMessage(null);

    try {
      const result = await pairKiosk(pairingCode);
      setKioskToken(result.deviceToken);
      clearCartItems();
      clearPaymentSnapshot();
      navigate("/products", { replace: true });
    } catch (error) {
      setErrorMessage(getPairingErrorMessage(error));
    } finally {
      setIsPairing(false);
    }
  }

  return (
    <PairingForm
      code={code}
      errorMessage={errorMessage}
      isPairing={isPairing}
      onCodeChange={setCode}
      onSubmit={handleSubmit}
    />
  );
}
