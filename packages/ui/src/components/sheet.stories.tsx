import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "./button";
import { Sheet } from "./sheet";

const meta = {
  title: "Components/Sheet",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function SheetDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button onClick={() => setOpen(true)}>바텀시트 열기</Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="메뉴 옵션">
        <div className="space-y-3">
          <p className="text-body text-foreground-muted">
            누른 자리에서 바로 펼쳐지는 시트예요.
          </p>
          <Button block onClick={() => setOpen(false)}>
            확인
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

export const Default: Story = {
  render: () => <SheetDemo />,
};
