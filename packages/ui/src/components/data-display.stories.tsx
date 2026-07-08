import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar } from "./avatar";
import { CodeDisplay } from "./code-display";
import { CopyButton } from "./copy-button";

const meta = {
  title: "Components/DataDisplay",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Avatars: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar name="전민오" size="sm" />
      <Avatar name="전민오" size="md" />
      <Avatar name="전민오" size="lg" />
      <Avatar name="Flick" src="https://picsum.photos/80" size="lg" />
    </div>
  ),
};

export const Codes: Story = {
  render: () => (
    <div className="max-w-md space-y-3">
      <CodeDisplay code="A1B2-C3D4" />
      <CodeDisplay code="938271" size="lg" />
      <CodeDisplay code="VERY-LONG-CODE-0123456789-ABCDEF" />
    </div>
  ),
};

export const Copy: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <span className="font-mono text-body text-foreground">3456-7890</span>
      <CopyButton value="3456-7890" />
    </div>
  ),
};
