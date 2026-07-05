import type { Meta, StoryObj } from "@storybook/react-vite";
import { Inbox } from "lucide-react";
import { Button } from "./button";
import { EmptyState } from "./empty-state";
import { Loader } from "./loader";
import { Skeleton } from "./skeleton";
import { Stat } from "./stat";

const meta = {
  title: "Components/Feedback",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaders: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Loader size="sm" />
      <Loader size="md" />
      <Loader size="lg" />
    </div>
  ),
};

export const Skeletons: Story = {
  render: () => (
    <div className="max-w-md space-y-3 rounded-card border border-border bg-surface p-5">
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  ),
};

export const Stats: Story = {
  render: () => (
    <div className="grid max-w-md grid-cols-2 gap-3">
      <Stat label="오늘 매출" value="128,000원" hint="어제보다 +12%" />
      <Stat label="주문 수" value="47" />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="max-w-md rounded-card border border-border bg-surface">
      <EmptyState
        emoji="🧾"
        title="아직 거래 내역이 없어요"
        description="첫 충전을 하면 여기에 표시돼요."
        action={<Button variant="weak">충전하러 가기</Button>}
      />
    </div>
  ),
};

export const EmptyWithIcon: Story = {
  render: () => (
    <div className="max-w-md rounded-card border border-border bg-surface">
      <EmptyState
        icon={<Inbox />}
        title="주문이 없어요"
        description="새 주문이 들어오면 알려드릴게요."
      />
    </div>
  ),
};
