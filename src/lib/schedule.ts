const DAY_LABELS: Record<number, string> = {
  2: "Thứ 2",
  3: "Thứ 3",
  4: "Thứ 4",
  5: "Thứ 5",
  6: "Thứ 6",
  7: "Thứ 7",
  8: "Chủ nhật",
};

/** [2, 4, 6], "17:30", "18:30" -> "Thứ 2, Thứ 4, Thứ 6 · 17:30 - 18:30" */
export function formatSchedule(days: number[], start: string, end: string): string {
  const dayText = days.map((d) => DAY_LABELS[d] ?? `Thứ ${d}`).join(", ");
  return `${dayText} · ${start} - ${end}`;
}

/** "2026-10-16" -> "Thứ 6, 16/10/2026". Tính từ các thành phần ngày để không lệch múi giờ. */
export function formatSessionDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const dow = new Date(year, month - 1, day).getDay(); // 0 = Chủ nhật
  const label = dow === 0 ? DAY_LABELS[8] : DAY_LABELS[dow + 1];
  return `${label}, ${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}
