import { Button } from "@flick/ui";
import { TriangleAlert } from "lucide-react";

type ProductsErrorStateProps = {
  onRetry: () => void;
};

export function ProductsErrorState({ onRetry }: ProductsErrorStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-subtle text-danger">
        <TriangleAlert className="size-8" strokeWidth={2} />
      </div>
      <h2 className="mt-4 text-title font-bold text-danger">
        상품을 불러올 수 없어요
      </h2>
      <p className="mt-2 text-body font-medium text-foreground-subtle">
        서버 연결 상태를 확인한 뒤 다시 시도해주세요
      </p>
      <Button size="lg" className="mt-6" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  );
}
