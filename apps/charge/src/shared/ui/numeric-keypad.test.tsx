import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { NumericKeypad } from "./numeric-keypad.tsx";

function Harness({ max }: { max?: number }) {
  const [value, setValue] = useState(0);
  return (
    <div>
      <span data-testid="value">{value}</span>
      <NumericKeypad value={value} onChange={setValue} max={max} />
    </div>
  );
}

function value(): number {
  return Number(screen.getByTestId("value").textContent);
}

function tap(name: string): void {
  fireEvent.click(screen.getByRole("button", { name }));
}

describe("NumericKeypad", () => {
  it("appends digits in order", () => {
    render(<Harness />);
    tap("1");
    tap("5");
    expect(value()).toBe(15);
  });

  it("appends two zeros for the 00 key", () => {
    render(<Harness />);
    tap("3");
    tap("00");
    expect(value()).toBe(300);
  });

  it("clamps to max", () => {
    render(<Harness max={5000} />);
    tap("9");
    tap("9");
    tap("9");
    tap("9");
    expect(value()).toBe(5000);
  });

  it("removes the last digit", () => {
    render(<Harness />);
    tap("1");
    tap("2");
    tap("3");
    tap("지우기");
    expect(value()).toBe(12);
  });
});
