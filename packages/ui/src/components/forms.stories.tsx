import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "./checkbox";
import { Input } from "./input";
import { Select } from "./select";
import { Switch } from "./switch";
import { Textarea } from "./textarea";

const meta = {
  title: "Components/Forms",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fields: Story = {
  render: () => (
    <div className="max-w-sm space-y-4">
      <Input label="메뉴 이름" placeholder="예: 떡볶이" />
      <Input
        label="가격"
        placeholder="0"
        inputMode="numeric"
        help="숫자만 입력해요."
      />
      <Input
        label="결제 코드"
        defaultValue="ABCD"
        error="코드를 다시 확인해 주세요."
      />
      <Select label="카테고리" defaultValue="food">
        <option value="food">음식</option>
        <option value="drink">음료</option>
      </Select>
      <Textarea label="설명" placeholder="메뉴 설명을 적어주세요." />
    </div>
  ),
};

export const Switches: Story = {
  render: () => (
    <div className="max-w-sm space-y-4">
      <Switch defaultChecked label="재고 무제한" />
      <Switch label="품절 알림" description="재고가 소진되면 알려드려요." />
      <Switch size="sm" defaultChecked label="작은 사이즈" />
      <Switch disabled label="비활성" />
      <Switch defaultChecked aria-label="라벨 없는 스위치" />
    </div>
  ),
};

export const Checkboxes: Story = {
  render: () => (
    <div className="max-w-sm space-y-4">
      <Checkbox defaultChecked label="필수 옵션" />
      <Checkbox
        label="약관에 동의합니다"
        description="주문 완료 후 취소가 어려울 수 있어요."
      />
      <Checkbox disabled label="비활성" />
      <Checkbox defaultChecked aria-label="라벨 없는 체크박스" />
    </div>
  ),
};
