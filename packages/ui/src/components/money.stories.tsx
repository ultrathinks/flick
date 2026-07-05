import type { Meta, StoryObj } from "@storybook/react-vite";
import { Money } from "./money";
import { RollingNumber } from "./rolling-number";

const meta = {
  title: "Components/Money",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Amounts: Story = {
  render: () => (
    <div className="space-y-3">
      <p>
        <Money
          amount={128000}
          className="text-display font-bold text-foreground"
        />
      </p>
      <p>
        <Money
          amount={10000}
          signed
          className="text-heading font-semibold text-brand"
        />
      </p>
      <p>
        <Money
          amount={-3000}
          signed
          className="text-heading font-semibold text-foreground"
        />
      </p>
    </div>
  ),
};

export const Rolling: Story = {
  render: () => (
    <RollingNumber
      value={128000}
      className="text-display font-bold text-foreground"
    />
  ),
};
