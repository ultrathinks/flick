export function formatWon(amount: number) {
  return `${Math.round(amount).toLocaleString("ko-KR")}원`;
}
