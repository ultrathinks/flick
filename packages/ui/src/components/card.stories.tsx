import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "./card";

const meta = {
  title: "Components/Card",
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
      <Card>
        <p className="text-heading font-bold text-foreground">기본 카드</p>
        <p className="mt-1 text-body text-foreground-subtle">
          그림자 없이 보더로만 배경과 구분해요.
        </p>
      </Card>
      <Card hover>
        <p className="text-heading font-bold text-foreground">호버 카드</p>
        <p className="mt-1 text-body text-foreground-subtle">
          마우스를 올리면 배경이 살짝 밝아져요.
        </p>
      </Card>
      <Card className="bg-brand text-brand-foreground">
        <p className="text-heading font-bold">브랜드 카드</p>
        <p className="mt-1 text-body text-brand-foreground/70">
          잔액 같은 핵심 요약에 사용해요.
        </p>
      </Card>
    </div>
  ),
};
