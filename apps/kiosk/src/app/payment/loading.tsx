import { Loading } from "@/shared/ui/loading";

export default function PaymentLoading() {
  return (
    <main className="min-h-dvh bg-white">
      <Loading label="결제 정보를 불러오는 중입니다" />
    </main>
  );
}
