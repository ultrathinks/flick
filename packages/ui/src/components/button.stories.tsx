import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { children: "결제하기", variant: "fill", size: "md" },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="fill">채우기</Button>
      <Button variant="weak">약하게</Button>
      <Button variant="neutral">중립</Button>
      <Button variant="outline">외곽선</Button>
      <Button variant="ghost">고스트</Button>
      <Button variant="danger">삭제</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">XLarge</Button>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button>기본</Button>
      <Button disabled>비활성</Button>
      <Button loading>로딩</Button>
    </div>
  ),
};

export const Block: Story = {
  render: () => (
    <div className="max-w-sm">
      <Button block size="lg">
        결제하기
      </Button>
    </div>
  ),
};
