/** "2025-03-07" -> "07/03/2025". Cắt chuỗi thủ công để tránh lệch múi giờ. */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

/** "0912345678" -> "0912 345 678" */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\s+/g, "");
  if (digits.length !== 10) return phone;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}
