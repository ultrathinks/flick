import { Loading } from "@/shared/ui/loading";

export default function ProductsLoading() {
  return (
    <main className="min-h-dvh bg-white">
      <Loading label="상품을 불러오는 중입니다" />
    </main>
  );
}
