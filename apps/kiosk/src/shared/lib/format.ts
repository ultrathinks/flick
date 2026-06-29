export function formatMoney(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function formatSeconds(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${rest
    .toString()
    .padStart(2, "0")}`;
}
