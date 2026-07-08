import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";

export interface QrScanHandle {
  stop: () => void;
}

const constraints: MediaStreamConstraints = {
  audio: false,
  video: { facingMode: "environment" },
};

export function startQrScan(
  video: HTMLVideoElement,
  onResult: (text: string) => void,
  onError: (error: unknown) => void,
): QrScanHandle {
  let controls: IScannerControls | undefined;
  let stream: MediaStream | undefined;
  let canceled = false;

  const stopStream = () => {
    for (const track of stream?.getTracks() ?? []) {
      track.stop();
    }
    stream = undefined;
    if (video.srcObject) {
      video.srcObject = null;
    }
  };

  (async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (canceled) {
        stopStream();
        return;
      }
      video.srcObject = stream;
      await video.play();
      if (canceled) {
        stopStream();
        return;
      }
      const reader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 120,
      });
      controls = reader.scan(video, (result) => {
        if (result && !canceled) {
          onResult(result.getText());
        }
      });
    } catch (error) {
      if (!canceled) {
        onError(error);
      }
      stopStream();
    }
  })();

  return {
    stop() {
      canceled = true;
      controls?.stop();
      stopStream();
    },
  };
}
