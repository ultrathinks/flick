import type { Meta, StoryObj } from "@storybook/react-vite";
import { LogOut, Settings } from "lucide-react";
import { Avatar } from "./avatar";
import { Button } from "./button";
import { ConfirmProvider, useConfirm } from "./confirm";
import { Menu, MenuItem } from "./menu";
import { Page } from "./page";
import { ToastProvider, useToast } from "./toast";

const meta = {
  title: "Components/Overlays",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dropdown: Story = {
  render: () => (
    <div className="flex justify-end p-8">
      <Menu
        trigger={({ toggle, triggerProps }) => (
          <button
            type="button"
            onClick={toggle}
            aria-label="계정"
            {...triggerProps}
          >
            <Avatar name="전민오" size="md" />
          </button>
        )}
      >
        <div className="px-3 py-2.5">
          <p className="text-body font-semibold text-foreground">전민오</p>
          <p className="text-caption text-foreground-subtle">3316</p>
        </div>
        <div className="my-1 h-px bg-border" />
        <MenuItem icon={<Settings />}>설정</MenuItem>
        <MenuItem tone="danger" icon={<LogOut />}>
          로그아웃
        </MenuItem>
      </Menu>
    </div>
  ),
};

function ToastDemo() {
  const toast = useToast();
  return (
    <div className="flex gap-2">
      <Button variant="neutral" onClick={() => toast.success("저장했어요")}>
        성공 토스트
      </Button>
      <Button
        variant="neutral"
        onClick={() => toast.error("문제가 발생했어요")}
      >
        에러 토스트
      </Button>
    </div>
  );
}

export const Toasts: Story = {
  render: () => (
    <ToastProvider>
      <ToastDemo />
    </ToastProvider>
  ),
};

function ConfirmDemo() {
  const confirm = useConfirm();
  return (
    <Button
      variant="danger"
      onClick={async () => {
        await confirm({
          title: "삭제할까요?",
          description: "이 작업은 되돌릴 수 없어요.",
          confirmLabel: "삭제",
          tone: "danger",
        });
      }}
    >
      확인 다이얼로그 열기
    </Button>
  );
}

export const Confirm: Story = {
  render: () => (
    <ConfirmProvider>
      <ConfirmDemo />
    </ConfirmProvider>
  ),
};

export const PageLayout: Story = {
  render: () => (
    <div className="min-h-64 bg-bg p-6">
      <Page
        title="주문"
        description="결제 내역과 매출을 확인하세요."
        actions={<Button size="sm">새로고침</Button>}
      >
        <div className="rounded-card border border-border bg-surface p-5 text-body text-foreground-subtle">
          페이지 콘텐츠 영역
        </div>
      </Page>
    </div>
  ),
};
