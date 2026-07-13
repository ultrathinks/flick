import { ScanLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Icon } from "@/shared/ui";
import { startQrScan } from "../lib/qr-decoder.ts";
import { useQrScan } from "../model/use-qr-scan.ts";

interface QrScannerProps {
  onDetect: (code: string) => void;
}

export const QrScanner = ({ onDetect }: QrScannerProps) => {
  const { nativeAvailable, startNative } = useQrScan(onDetect);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState(false);

  const onDetectRef = useRef(onDetect);
  onDetectRef.current = onDetect;

  useEffect(() => {
    if (nativeAvailable) {
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
  }, [nativeAvailable]);

  if (nativeAvailable) {
    return (
      <Button block size="lg" onClick={startNative}>
        <Icon icon={ScanLine} size={20} />
        QR 스캔
      </Button>
    );
  }

  if (cameraError) {
    return (
      <div className="rounded-card border border-border bg-surface p-4 text-center text-caption text-foreground-subtle">
        카메라를 사용할 수 없어요. 아래에 코드를 직접 입력해 주세요.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-card border border-border bg-black">
      <video
        ref={videoRef}
        muted
        playsInline
        className="aspect-square w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative aspect-square w-[64%]">
          <span className="absolute top-0 left-0 size-8 rounded-tl-xl border-white border-t-4 border-l-4" />
          <span className="absolute top-0 right-0 size-8 rounded-tr-xl border-white border-t-4 border-r-4" />
          <span className="absolute bottom-0 left-0 size-8 rounded-bl-xl border-white border-b-4 border-l-4" />
          <span className="absolute right-0 bottom-0 size-8 rounded-br-xl border-white border-r-4 border-b-4" />
        </div>
      </div>
    </div>
  );
};
