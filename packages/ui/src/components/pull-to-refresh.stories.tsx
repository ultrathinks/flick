import type { Meta, StoryObj } from "@storybook/react-vite";
import { PullToRefresh } from "./pull-to-refresh";

const meta = {
  title: "Components/PullToRefresh",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const rows = Array.from({ length: 20 }, (_, i) => `항목 ${i + 1}`);

export const Default: Story = {
  render: () => (
    <div className="mx-auto h-[560px] w-[380px] overflow-hidden rounded-card border border-border bg-bg">
      <PullToRefresh className="h-full" onRefresh={() => wait(1500)}>
        <div className="space-y-3 p-5">
          <p className="text-caption text-foreground-subtle">
            아래로 당겨 새로고침 (터치 기기 또는 DevTools 기기 모드에서 확인)
          </p>
          {rows.map((row) => (
            <div
              key={row}
              className="rounded-card border border-border bg-surface p-4 text-body text-foreground"
            >
              {row}
            </div>
          ))}
        </div>
      </PullToRefresh>
    </div>
  ),
};
