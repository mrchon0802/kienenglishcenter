const vnd = new Intl.NumberFormat("vi-VN");

/** 48500000 -> "48.500.000 đ" */
export function formatVND(amount: number): string {
  return `${vnd.format(amount)} đ`;
}

/** 7.2 -> "7,2" */
export function formatScore(score: number): string {
  return score.toFixed(1).replace(".", ",");
}

/** 48.5 -> "48,5"; 41 -> "41" */
export function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value).replace(".", ",");
}

/** "Thứ Năm, 15/10/2026" */
export function formatLongDate(date: Date): string {
  const text = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}
