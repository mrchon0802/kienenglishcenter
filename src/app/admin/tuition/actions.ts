"use server";

import { revalidatePath } from "next/cache";
import { isValidISODate, isValidMonth, toISODate } from "@/lib/month";
import {
  addPayment,
  createInvoicesForMonth,
  getInvoiceViewById,
  removePayment,
} from "@/mocks/tuition";
import type { PaymentMethod } from "@/types/tuition";

function refresh() {
  revalidatePath("/admin/tuition");
  revalidatePath("/admin/tuition/debts");
  revalidatePath("/admin/tuition/revenue");
  revalidatePath("/student/tuition");
}

/**
 * Tạo hóa đơn học phí cho tháng đã chọn (bỏ qua học sinh đã có hóa đơn tháng đó).
 * TODO (khi có backend): việc này nên chạy tự động đầu mỗi tháng (cron) và cũng gọi được thủ công.
 */
export async function generateInvoicesAction(
  month: string,
): Promise<{ ok: true; created: number; skipped: number } | { ok: false; error: string }> {
  if (!isValidMonth(month)) return { ok: false, error: "Tháng không hợp lệ." };
  const result = await createInvoicesForMonth(month);
  refresh();
  return { ok: true, ...result };
}

/** TODO (khi có backend): gọi API POST /invoices/:id/payments. */
export async function recordPaymentAction(input: {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  note: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const today = toISODate(new Date());
  const invoice = await getInvoiceViewById(input.invoiceId, today);
  if (!invoice) return { ok: false, error: "Không tìm thấy hóa đơn." };
  if (!Number.isFinite(input.amount) || input.amount <= 0) return { ok: false, error: "Số tiền phải lớn hơn 0." };
  if (input.amount > invoice.remaining) return { ok: false, error: "Số tiền vượt quá số còn phải đóng." };
  if (input.method !== "cash" && input.method !== "transfer") return { ok: false, error: "Hình thức thanh toán không hợp lệ." };
  if (!isValidISODate(input.paidAt) || input.paidAt > today) return { ok: false, error: "Ngày thu không hợp lệ (không được ở tương lai)." };
  if (input.note.length > 200) return { ok: false, error: "Ghi chú tối đa 200 ký tự." };

  await addPayment({
    invoiceId: input.invoiceId,
    amount: Math.round(input.amount),
    method: input.method,
    paidAt: input.paidAt,
    note: input.note.trim(),
  });
  refresh();
  return { ok: true };
}

/** Dùng để sửa nhầm lần nhập: xóa khoản thu rồi nhập lại. */
export async function deletePaymentAction(paymentId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const invoiceId = await removePayment(paymentId);
  if (!invoiceId) return { ok: false, error: "Không tìm thấy khoản thu." };
  refresh();
  return { ok: true };
}
