import { Button, Card } from "@/shared/ui";
import { usePayByCode } from "../model/use-pay-by-code.ts";

export const PayByCode = () => {
  const { manualCode, setManualCode, scan, submitManual } = usePayByCode();

  return (
    <div className="space-y-4">
      <Card className="flex flex-col items-center gap-4 py-8 text-center">
        <p className="text-sm text-zinc-500">
          키오스크 화면의 QR 코드를 스캔하세요
        </p>
        <Button fullWidth={false} onClick={scan}>
          QR 스캔하기
        </Button>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-medium text-zinc-700">코드 직접 입력</p>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            submitManual();
          }}
        >
          <input
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value)}
            placeholder="결제 코드"
            className="h-12 flex-1 rounded-xl border border-zinc-200 px-4 text-base outline-none focus:border-blue-500"
          />
          <Button
            type="submit"
            variant="secondary"
            fullWidth={false}
            disabled={manualCode.trim().length === 0}
          >
            확인
          </Button>
        </form>
      </Card>
    </div>
  );
};
