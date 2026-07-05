import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./input";
import { Select } from "./select";
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
