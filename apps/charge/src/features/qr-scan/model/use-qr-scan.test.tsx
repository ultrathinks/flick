import { ToastProvider } from "@flick/ui";
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type QrHandler = (response: unknown) => Promise<unknown>;

let qrHandler: QrHandler | null = null;

vi.mock("@b1nd/aid-kit/bridge-kit/web", () => ({
  Actions: { QR_SCAN: "QR_SCAN" },
  useBridgeProvider: () => ({ send: () => undefined }),
  useBridgeResponse: (type: string, handler: QrHandler) => {
    if (type === "QR_SCAN") {
      qrHandler = handler;
    }
  },
}));

import { useQrScan } from "./use-qr-scan.ts";

const ERROR_MESSAGE = "QR을 인식하지 못했어요. 다시 시도해 주세요.";

function Harness({ onDetect }: { onDetect: (code: string) => void }) {
  useQrScan(onDetect);
  return null;
}

function renderHarness(onDetect: (code: string) => void) {
  qrHandler = null;
  render(
    <ToastProvider>
      <Harness onDetect={onDetect} />
    </ToastProvider>,
  );
}

describe("charge QR_SCAN bridge response", () => {
  beforeEach(() => {
    qrHandler = null;
  });

  it("detects the code from the native response shape (response.data.value)", async () => {
    const onDetect = vi.fn();
    renderHarness(onDetect);

    await act(async () => {
      await qrHandler?.({
        id: "1",
        type: "QR_SCAN",
        success: true,
        data: { value: "482913" },
      });
    });

    expect(onDetect).toHaveBeenCalledWith("482913");
    expect(screen.queryByText(ERROR_MESSAGE)).toBeNull();
  });

  it("shows a toast (and does not detect) when the scan returns no usable value", async () => {
    const onDetect = vi.fn();
    renderHarness(onDetect);

    await act(async () => {
      await qrHandler?.({
        id: "2",
        type: "QR_SCAN",
        success: true,
        text: "482913",
      });
    });

    expect(onDetect).not.toHaveBeenCalled();
    expect(screen.getByText(ERROR_MESSAGE)).toBeInTheDocument();
  });

  it("stays silent when the user cancels the scan", async () => {
    const onDetect = vi.fn();
    renderHarness(onDetect);

    await act(async () => {
      await qrHandler?.({
        id: "3",
        type: "QR_SCAN",
        success: false,
        error: "CANCELLED",
      });
    });

    expect(onDetect).not.toHaveBeenCalled();
    expect(screen.queryByText(ERROR_MESSAGE)).toBeNull();
  });
});
