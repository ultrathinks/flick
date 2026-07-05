import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bell, CreditCard, Home, Receipt, User, Wallet } from "lucide-react";
import { Icon } from "./icon";

const meta = {
  title: "Components/Icon",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const icons = [Home, Wallet, Receipt, CreditCard, Bell, User];

export const Gallery: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 text-foreground">
      {icons.map((icon) => (
        <Icon key={icon.displayName ?? icon.name} icon={icon} size={24} />
      ))}
      <Icon icon={Wallet} size={24} className="text-brand" />
    </div>
  ),
};
