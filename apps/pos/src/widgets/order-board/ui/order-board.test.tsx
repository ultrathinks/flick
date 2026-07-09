import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { booth } from "@/mocks/fixtures.ts";
import { renderWithProviders } from "@/test/render.tsx";
import { OrderBoard } from "./order-board.tsx";

describe("OrderBoard", () => {
  it("renders mocked orders with a revenue summary", async () => {
    renderWithProviders(<OrderBoard booth={booth} />);

    await waitFor(() =>
      expect(screen.getAllByText("7,000원").length).toBeGreaterThan(0),
    );

    expect(screen.getAllByText("결제 완료").length).toBeGreaterThan(0);
    expect(screen.getAllByText("결제 대기").length).toBeGreaterThan(0);
  });
});
