import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render.tsx";
import { BoothQueue } from "./booth-queue.tsx";

describe("BoothQueue", () => {
  it("shows pending booths from the mocked API by default", async () => {
    renderWithProviders(<BoothQueue />);

    await waitFor(() =>
      expect(screen.getByText("떡볶이 부스")).toBeInTheDocument(),
    );
  });
});
