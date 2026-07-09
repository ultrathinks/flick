import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { useOrders } from "./order-api.ts";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useOrders", () => {
  it("returns a cursor page of mocked orders", async () => {
    const { result } = renderHook(() => useOrders({}), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const items = result.current.data?.pages[0]?.items ?? [];
    expect(items).toHaveLength(2);
    expect(items[0]?.boothName).toBe("음료 부스");
  });

  it("filters by status", async () => {
    const { result } = renderHook(() => useOrders({ status: "paid" }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const items = result.current.data?.pages[0]?.items ?? [];
    expect(items).toHaveLength(1);
    expect(items[0]?.status).toBe("paid");
  });
});
