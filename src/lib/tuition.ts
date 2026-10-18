import type { InvoiceStatus, PaymentMethod } from "@/types/tuition";

export const STATUS_LABEL: Record<InvoiceStatus, string> = {
  paid: "Đã đóng",
  partial: "Đóng một phần",
  unpaid: "Chưa đóng",
  overdue: "Quá hạn",
};

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Tiền mặt",
  transfer: "Chuyển khoản",
};

export const METHOD_OPTIONS = [
  { value: "cash", label: METHOD_LABEL.cash },
  { value: "transfer", label: METHOD_LABEL.transfer },
];

export const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as InvoiceStatus[]).map((value) => ({
  value,
  label: STATUS_LABEL[value],
}));

/** Quá hạn được ưu tiên hơn "đóng một phần" và "chưa đóng". `today` dạng "yyyy-mm-dd". */
export function computeStatus(remaining: number, paid: number, dueDate: string, today: string): InvoiceStatus {
  if (remaining <= 0) return "paid";
  if (dueDate < today) return "overdue";
  return paid > 0 ? "partial" : "unpaid";
}
