"use server";

import { requireAdminAction } from "@/lib/action-auth";

import { revalidatePath } from "next/cache";
import { isValidISODate, isValidMonth, toISODate } from "@/lib/month";
import {
  addPayment,
  createInvoicesForMonth,
  getInvoiceViewById,
  getStudentInvoiceViews,
  removePayment,
} from "@/mocks/tuition";
import type { PaymentMethod } from "@/types/tuition";
import { notifyTuitionPayment } from "@/mocks/tuition-notifications";
import { updatePaymentReconciliation } from "@/mocks/tuition-reconciliation";
import type { ReconciliationStatus } from "@/types/tuition-reconciliation";


function refresh() {
  revalidatePath("/admin/tuition");
  revalidatePath("/admin/tuition/debts");
  revalidatePath("/admin/tuition/revenue");
  revalidatePath("/admin/tuition/reminders");
  revalidatePath("/teacher/tuition");
  revalidatePath("/student/notifications");
  revalidatePath("/parent/notifications");
  revalidatePath("/student/tuition");
}

/**
 * Tạo hóa đơn học phí cho tháng đã chọn (bỏ qua học sinh đã có hóa đơn tháng đó).
 * TODO (khi có backend): việc này nên chạy tự động đầu mỗi tháng (cron) và cũng gọi được thủ công.
 */
export async function generateInvoicesAction(
  month: string,
): Promise<{ ok: true; created: number; skipped: number } | { ok: false; error: string }> {
  await requireAdminAction();

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
  await requireAdminAction();

  const today = toISODate(new Date());
  const invoice = await getInvoiceViewById(input.invoiceId, today);
  if (!invoice) return { ok: false, error: "Không tìm thấy hóa đơn." };
  if (!Number.isFinite(input.amount) || input.amount <= 0) return { ok: false, error: "Số tiền phải lớn hơn 0." };
  if (input.amount > invoice.remaining) return { ok: false, error: "Số tiền vượt quá số còn phải đóng." };
  if (input.method !== "cash" && input.method !== "transfer") return { ok: false, error: "Hình thức thanh toán không hợp lệ." };
  if (!isValidISODate(input.paidAt) || input.paidAt > today) return { ok: false, error: "Ngày thu không hợp lệ (không được ở tương lai)." };
  if (input.note.length > 200) return { ok: false, error: "Ghi chú tối đa 200 ký tự." };

  const payment = await addPayment({
    invoiceId: input.invoiceId,
    amount: Math.round(input.amount),
    method: input.method,
    paidAt: input.paidAt,
    note: input.note.trim(),
  });
  await notifyTuitionPayment(input.invoiceId, payment.id, today);
  refresh();
  return { ok: true };
}


/** Ghi nhận một khoản thu chung và tự phân bổ vào các hóa đơn còn nợ lâu nhất của học sinh. */
export async function recordStudentPaymentAction(formData: FormData): Promise<void> {
  await requireAdminAction();

  const studentId = String(formData.get("studentId") ?? "");
  const rawAmount = Number(formData.get("amount"));
  const method = String(formData.get("method") ?? "");
  const paidAt = String(formData.get("paidAt") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const today = toISODate(new Date());

  if (!studentId) throw new Error("Thiếu mã học sinh.");
  if (!Number.isSafeInteger(rawAmount) || rawAmount <= 0) throw new Error("Số tiền thanh toán không hợp lệ.");
  if (method !== "cash" && method !== "transfer") throw new Error("Hình thức thanh toán không hợp lệ.");
  if (!isValidISODate(paidAt) || paidAt > today) throw new Error("Ngày thu không hợp lệ.");
  if (note.length > 200) throw new Error("Ghi chú tối đa 200 ký tự.");

  const studentInvoices = (await getStudentInvoiceViews(studentId, today))
    .filter((invoice) => invoice.remaining > 0)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.month.localeCompare(b.month));

  const totalRemaining = studentInvoices.reduce((sum, invoice) => sum + invoice.remaining, 0);
  if (rawAmount > totalRemaining) throw new Error("Số tiền vượt quá tổng công nợ của học sinh.");

  let amountLeft = rawAmount;
  for (const invoice of studentInvoices) {
    if (amountLeft <= 0) break;
    const allocated = Math.min(amountLeft, invoice.remaining);
    const payment = await addPayment({
      invoiceId: invoice.id,
      amount: allocated,
      method,
      paidAt,
      note: note ? `${note} (Thanh toán gộp)` : "Thanh toán gộp",
    });
    await notifyTuitionPayment(invoice.id, payment.id, today);
    amountLeft -= allocated;
  }

  refresh();
  revalidatePath(`/admin/tuition/students/${studentId}`);
}

/** Dùng để sửa nhầm lần nhập: xóa khoản thu rồi nhập lại. */
export async function deletePaymentAction(paymentId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdminAction();

  const invoiceId = await removePayment(paymentId);
  if (!invoiceId) return { ok: false, error: "Không tìm thấy khoản thu." };
  refresh();
  return { ok: true };
}


/** Cập nhật trạng thái đối soát; không sửa dữ liệu khoản thu gốc. */
export async function updatePaymentReconciliationAction(input: {
  paymentId: string;
  status: ReconciliationStatus;
  note: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdminAction();
  if (!input || typeof input.paymentId !== "string" || typeof input.note !== "string") {
    return { ok: false, error: "Dữ liệu đối soát không hợp lệ." };
  }
  const result = await updatePaymentReconciliation({
    paymentId: input.paymentId,
    status: input.status,
    note: input.note,
    changedBy: "Admin",
  });
  if (!result.ok) return result;
  revalidatePath("/admin/tuition/transactions");
  return { ok: true };
}
