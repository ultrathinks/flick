import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { sseState, fetchPayment } = vi.hoisted(() => ({
  sseState: {
    status: "open" as string,
    lastEvent: null as { event: string; data: Record<string, unknown> } | null,
  },
  fetchPayment: vi.fn(),
}));

vi.mock("@/shared/api/use-payment-sse", () => ({
  usePaymentSSE: () => sseState,
}));

vi.mock("@/entities/order/api/orders", () => ({
  fetchPayment,
}));

import { usePaymentResolution } from "./use-payment-resolution.ts";

describe("usePaymentResolution dedupe", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchPayment.mockReset();
    sseState.lastEvent = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves once when both the sse event and the poll report completion", async () => {
    const onResolved = vi.fn();
    fetchPayment.mockResolvedValue({ payment: { status: "completed" } });

    const { rerender } = renderHook(() =>
      usePaymentResolution({ paymentId: "p1", token: "t1", onResolved }),
    );

    sseState.lastEvent = {
      event: "message",
      data: { type: "payment.completed" },
    };
    rerender();

    expect(onResolved).toHaveBeenCalledTimes(1);
    expect(onResolved).toHaveBeenCalledWith("completed");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(onResolved).toHaveBeenCalledTimes(1);
  });
});
