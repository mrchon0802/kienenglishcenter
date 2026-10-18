/** "2026-10-20T20:00" -> "20/10/2026 20:00" */
export function formatDateTime(local: string): string {
  const [date, time = ""] = local.split("T");
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return local;
  return `${day}/${month}/${year}${time ? ` ${time.slice(0, 5)}` : ""}`;
}

/** Date -> "yyyy-mm-ddTHH:mm" theo giờ địa phương (dùng cho ô datetime-local). */
export function toLocalInput(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}
