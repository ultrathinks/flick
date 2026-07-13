import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@b1nd/aid-kit/bridge-kit/web", () => ({
  Actions: { HAPTIC: "haptic" },
  useBridgeProvider: () => ({ send: () => undefined }),
}));

import { useMe } from "@/entities/user";
import { me, order } from "@/mocks/fixtures.ts";
import { server } from "@/mocks/server.ts";
import { useConfirmPayment } from "./use-confirm-payment.ts";

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function ConfirmView() {
  const meQuery = useMe();
  const confirm = useConfirmPayment("OK123");
  return (
    <div>
      <span data-testid="balance">{meQuery.data?.balance ?? "loading"}</span>
      <button type="button" onClick={() => confirm.mutate()}>
        pay
      </button>
    </div>
  );
}

describe("pay-by-code confirm flow", () => {
  it("refetches the balance after a successful confirm", async () => {
    let balance = 10000;
    server.use(
      http.get("/v1/users/me", () => HttpResponse.json({ ...me, balance })),
      http.post("/v1/payment-codes/:code/confirm", () => {
        balance = 8000;
        return HttpResponse.json(order);
      }),
    );

    render(
      <Wrapper>
        <ConfirmView />
      </Wrapper>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("balance")).toHaveTextContent("10000"),
    );
    fireEvent.click(screen.getByText("pay"));
    await waitFor(() =>
      expect(screen.getByTestId("balance")).toHaveTextContent("8000"),
    );
  });
});
