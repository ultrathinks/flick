import { Button, Card, Input } from "@/shared/ui";
import { usePayByCode } from "../model/use-pay-by-code.ts";

export const PayByCode = () => {
  const { manualCode, setManualCode, scan, submitManual } = usePayByCode();

  return (
    <div className="space-y-4">
      <Card className="flex flex-col items-center gap-4 py-8 text-center">
        <p className="text-body text-foreground-subtle">
          키오스크 화면의 QR 코드를 스캔하세요
        </p>
        <Button size="lg" onClick={scan}>
          QR 스캔하기
        </Button>
      </Card>

      <Card className="space-y-3">
        <p className="text-body font-medium text-foreground-muted">
          코드 직접 입력
        </p>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            submitManual();
          }}
        >
          <Input
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value)}
            placeholder="결제 코드"
            className="flex-1"
          />
          <Button
            type="submit"
            variant="neutral"
            disabled={manualCode.trim().length === 0}
          >
            확인
          </Button>
        </form>
      </Card>
    </div>
  );
};
