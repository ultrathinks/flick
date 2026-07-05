import type { Meta, StoryObj } from "@storybook/react-vite";
import { CreditCard, Receipt, Wallet } from "lucide-react";
import { Icon } from "./icon";
import { ListRow } from "./list-row";
import { Money } from "./money";
import { SectionHeader } from "./section-header";

const meta = {
  title: "Components/List",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const TransactionList: Story = {
  render: () => (
    <div className="max-w-md">
      <SectionHeader title="최근 거래" action="전체 보기" />
      <div className="divide-y divide-border rounded-card border border-border bg-surface px-4">
        <ListRow
          left={<Icon icon={Wallet} className="text-brand" />}
          title="충전"
          description="7월 5일"
          right={<Money amount={10000} signed className="text-brand" />}
          onClick={() => {}}
        />
        <ListRow
          left={<Icon icon={Receipt} className="text-foreground-subtle" />}
          title="핫도그 부스"
          description="7월 5일"
          right={<Money amount={-3000} signed />}
          onClick={() => {}}
        />
        <ListRow
          left={<Icon icon={CreditCard} className="text-foreground-subtle" />}
          title="음료 부스"
          description="7월 4일"
          right={<Money amount={-2500} signed />}
          withArrow
          onClick={() => {}}
        />
      </div>
    </div>
  ),
};

export const SettingsList: Story = {
  render: () => (
    <div className="max-w-md">
      <SectionHeader title="설정" />
      <div className="divide-y divide-border rounded-card border border-border bg-surface px-4">
        <ListRow
          title="화면 테마"
          right="시스템"
          withArrow
          onClick={() => {}}
        />
        <ListRow title="알림" right="켜짐" withArrow onClick={() => {}} />
        <ListRow title="로그아웃" onClick={() => {}} />
      </div>
    </div>
  ),
};
