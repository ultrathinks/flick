import { KeyboardIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Icon, Input } from "@/shared/ui";
import { startQrScan } from "../lib/qr-decoder.ts";

type Mode = "camera" | "manual";

interface QrScannerProps {
  onDetect: (code: string) => void;
  onClose: () => void;
}

export const QrScanner = ({ onDetect, onClose }: QrScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<Mode>("camera");
  const [cameraError, setCameraError] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const onDetectRef = useRef(onDetect);
  onDetectRef.current = onDetect;

  useEffect(() => {
    if (mode !== "camera") {
      return;
    }
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const handle = startQrScan(
      video,
      (text) => onDetectRef.current(text),
      () => setCameraError(true),
    );

    return () => handle.stop();
  }, [mode]);

  const submitManual = () => {
    const trimmed = manualCode.trim();
    if (trimmed.length > 0) {
      onDetect(trimmed);
    }
  };

  const showManual = mode === "manual" || cameraError;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <header className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top)]">
        <div className="flex h-14 items-center">
          <span className="text-heading font-semibold">결제 코드 스캔</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="-mr-2 inline-flex size-11 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 active:scale-95"
        >
          <Icon icon={XIcon} size={24} />
        </button>
      </header>

      {showManual ? (
        <div className="flex flex-1 flex-col justify-center gap-6 px-6 pb-10">
          <div className="space-y-2 text-center">
            <p className="text-title font-bold">코드를 직접 입력해 주세요</p>
            <p className="text-body text-white/60">
              {cameraError
                ? "카메라를 사용할 수 없어요. 결제 코드를 입력하면 돼요."
                : "부스에서 받은 결제 코드를 입력해 주세요."}
            </p>
          </div>
          <div className="space-y-3">
            <Input
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  submitManual();
                }
              }}
              placeholder="결제 코드"
              autoFocus
              className="text-center"
            />
            <Button
              block
              size="lg"
              onClick={submitManual}
              disabled={manualCode.trim().length === 0}
            >
              결제하기
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative flex flex-1 items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              muted
              playsInline
              className="absolute inset-0 size-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-black/40" />
            <div className="pointer-events-none relative aspect-square w-[68%] max-w-xs">
              <span className="absolute top-0 left-0 size-9 rounded-tl-xl border-white border-t-4 border-l-4" />
              <span className="absolute top-0 right-0 size-9 rounded-tr-xl border-white border-t-4 border-r-4" />
              <span className="absolute bottom-0 left-0 size-9 rounded-bl-xl border-white border-b-4 border-l-4" />
              <span className="absolute right-0 bottom-0 size-9 rounded-br-xl border-white border-r-4 border-b-4" />
            </div>
            <p className="pointer-events-none absolute bottom-28 px-8 text-center text-body text-white/80">
              QR 코드를 사각형 안에 맞춰 주세요
            </p>
          </div>

          <div className="px-6 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4">
            <Button
              block
              size="lg"
              variant="neutral"
              onClick={() => setMode("manual")}
              className="border-0 bg-white/10 text-white hover:bg-white/15"
            >
              <Icon icon={KeyboardIcon} size={18} />
              코드 직접 입력
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
