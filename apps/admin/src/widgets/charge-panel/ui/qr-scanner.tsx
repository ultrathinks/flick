"use client";

import type { IScannerControls } from "@zxing/browser";
import { BrowserQRCodeReader } from "@zxing/browser";
import { useEffect, useRef, useState } from "react";

export function QrScanner({ onScan }: { onScan: (text: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reader = new BrowserQRCodeReader();
    const video = videoRef.current;
    if (!video) {
      return;
    }
    let controls: IScannerControls | null = null;
    let stopped = false;

    reader
      .decodeFromVideoDevice(undefined, video, (result) => {
        if (result) {
          onScanRef.current(result.getText());
        }
      })
      .then((scannerControls) => {
        if (stopped) {
          scannerControls.stop();
          return;
        }
        controls = scannerControls;
      })
      .catch(() => {
        setError("카메라를 사용할 수 없어요. 코드를 직접 입력해 주세요.");
      });

    return () => {
      stopped = true;
      controls?.stop();
    };
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-card border border-border bg-black">
        <video ref={videoRef} className="aspect-square w-full object-cover" />
      </div>
      {error && <p className="text-caption text-danger">{error}</p>}
    </div>
  );
}
