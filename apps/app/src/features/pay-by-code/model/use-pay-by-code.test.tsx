import { ToastProvider } from "@flick/ui";
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type QrHandler = (response: unknown) => Promise<unknown>;

let qrHandler: QrHandler | null = null;

vi.mock("@b1nd/aid-kit/bridge-kit/web", () => ({
  Actions: { QR_SCAN: "QR_SCAN", HAPTIC: "HAPTIC" },
  useBridgeProvider: () => ({ send: () => undefined }),
  useBridgeResponse: (type: string, handler: QrHandler) => {
    if (type === "QR_SCAN") {
      qrHandler = handler;
    }
  },
}));

import { PayByCodeProvider, usePayByCode } from "./use-pay-by-code.tsx";

const ERROR_MESSAGE = "QR을 인식하지 못했어요. 다시 시도해 주세요.";

function ActiveCode() {
  const { activeCode } = usePayByCode();
  return <span data-testid="active">{activeCode ?? "none"}</span>;
}

function renderProvider() {
  qrHandler = null;
  render(
    <ToastProvider>
      <PayByCodeProvider>
        <ActiveCode />
      </PayByCodeProvider>
    </ToastProvider>,
  );
}

describe("pay-by-code QR_SCAN bridge response", () => {
  beforeEach(() => {
    qrHandler = null;
  });

  it("opens payment from the native response shape (response.data.value)", async () => {
    renderProvider();
    expect(qrHandler).toBeTypeOf("function");

    await act(async () => {
      await qrHandler?.({
        id: "1",
        type: "QR_SCAN",
        success: true,
        data: { value: "482913" },
      });
    });

    expect(screen.getByTestId("active")).toHaveTextContent("482913");
    expect(screen.queryByText(ERROR_MESSAGE)).toBeNull();
  });

  it("shows a toast (and does not open payment) when the scan returns no usable value", async () => {
    renderProvider();

    // the legacy top-level `text` shape must not be read, and must surface feedback
    await act(async () => {
      await qrHandler?.({
        id: "2",
        type: "QR_SCAN",
        success: true,
        text: "482913",
      });
    });

    expect(screen.getByTestId("active")).toHaveTextContent("none");
    expect(screen.getByText(ERROR_MESSAGE)).toBeInTheDocument();
  });

  it("stays silent when the user cancels the scan", async () => {
    renderProvider();

    await act(async () => {
      await qrHandler?.({
        id: "3",
        type: "QR_SCAN",
        success: false,
        error: "CANCELLED",
      });
    });

    expect(screen.getByTestId("active")).toHaveTextContent("none");
    expect(screen.queryByText(ERROR_MESSAGE)).toBeNull();
  });
});
