const formatter = new Intl.NumberFormat("ko-KR");

export function formatWon(amount: number): string {
  return `${formatter.format(amount)}원`;
}
