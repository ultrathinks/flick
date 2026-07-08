export function formatWon(amount: number) {
  const won = Math.round(amount);
  const normalized = Object.is(won, -0) ? 0 : won;
  return `${normalized.toLocaleString("ko-KR")}원`;
}
