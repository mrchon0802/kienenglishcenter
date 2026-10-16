/** Bỏ dấu tiếng Việt và chuyển về chữ thường để tìm kiếm: "Đặng Hải" -> "dang hai". */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim();
}
