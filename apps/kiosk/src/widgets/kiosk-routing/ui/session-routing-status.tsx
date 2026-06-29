import { Loading } from "@/shared/ui/loading";

export function SessionRoutingStatus() {
  return (
    <main className="min-h-dvh bg-white">
      <Loading label="키오스크 상태를 확인하는 중입니다" />
    </main>
  );
}
