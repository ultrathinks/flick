import { LogOut, Settings } from "lucide-react";
import { useState } from "react";
import { Button, Sheet, useConfirm } from "@/shared/ui";

type KioskSettingsProps = {
  kioskName?: string | null;
  boothName?: string | null;
  onUnpair: () => void;
};

export function KioskSettings({
  kioskName,
  boothName,
  onUnpair,
}: KioskSettingsProps) {
  const [open, setOpen] = useState(false);
  const confirm = useConfirm();

  const handleUnpair = async () => {
    const ok = await confirm({
      title: "키오스크 연결을 해제할까요?",
      description:
        "다시 사용하려면 부스 화면에서 페어링 코드를 발급받아야 해요.",
      confirmLabel: "연결 해제",
      tone: "danger",
    });
    if (!ok) return;
    setOpen(false);
    onUnpair();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon-lg"
        aria-label="설정"
        onClick={() => setOpen(true)}
      >
        <Settings className="size-6" />
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="키오스크 설정">
        <div className="space-y-6">
          <dl className="space-y-3">
            {boothName ? (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-body text-foreground-subtle">부스</dt>
                <dd className="text-body font-medium text-foreground">
                  {boothName}
                </dd>
              </div>
            ) : null}
            {kioskName ? (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-body text-foreground-subtle">키오스크</dt>
                <dd className="text-body font-medium text-foreground">
                  {kioskName}
                </dd>
              </div>
            ) : null}
          </dl>
          <Button
            variant="outline"
            size="lg"
            block
            className="text-danger"
            onClick={handleUnpair}
          >
            <LogOut className="size-5" />
            연결 해제
          </Button>
        </div>
      </Sheet>
    </>
  );
}
