"use server";

import { requireAdminAction } from "@/lib/action-auth";
import { revalidatePath } from "next/cache";
import { toISODate } from "@/lib/month";
import { createPaymentAgreement, sendManualTuitionReminders } from "@/mocks/tuition-notifications";
import { updateTuitionReminderSettings } from "@/mocks/tuition-reminder-settings";

export async function sendTuitionRemindersAction(): Promise<void> {
  await requireAdminAction();
  const today = toISODate(new Date());
  await sendManualTuitionReminders(today);
  revalidatePath("/admin/tuition/reminders");
  revalidatePath("/admin/tuition/debts");
  revalidatePath("/student/notifications");
  revalidatePath("/parent/notifications");
  revalidatePath("/teacher/tuition");
}

export async function saveTuitionReminderSettingsAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const number = (key: string) => Number(formData.get(key));
  const firstReminderDay = number("firstReminderDay");
  const dueDay = number("dueDay");
  const secondReminderDay = number("secondReminderDay");
  const followUpDay = number("followUpDay");
  const overdueWarningDays = number("overdueWarningDays");
  const criticalDebtDays = number("criticalDebtDays");
  if ([firstReminderDay, dueDay, secondReminderDay, followUpDay].some((v) => !Number.isInteger(v) || v < 1 || v > 28)) throw new Error("Ngày nhắc và ngày hạn phải từ 1 đến 28.");
  if (firstReminderDay >= dueDay || secondReminderDay <= dueDay) throw new Error("Ngày nhắc lần đầu phải trước hạn đóng và ngày nhắc lần hai phải sau hạn đóng.");
  if (!Number.isInteger(overdueWarningDays) || !Number.isInteger(criticalDebtDays) || overdueWarningDays < 1 || criticalDebtDays <= overdueWarningDays) throw new Error("Mốc cảnh báo công nợ không hợp lệ.");
  await updateTuitionReminderSettings({
    firstReminderDay, dueDay, secondReminderDay, followUpDay,
    overdueWarningDays, criticalDebtDays,
    notifyTeachers: formData.get("notifyTeachers") === "on",
    pauseDuringAgreement: formData.get("pauseDuringAgreement") === "on",
  });
  revalidatePath("/admin/tuition");
  revalidatePath("/admin/tuition/reminders");
  revalidatePath("/admin/tuition/debts");
}

export async function createPaymentAgreementAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const invoiceId = String(formData.get("invoiceId") ?? "");
  const promisedDate = String(formData.get("promisedDate") ?? "");
  const expectedAmount = Number(formData.get("expectedAmount"));
  const note = String(formData.get("note") ?? "").trim();
  const today = toISODate(new Date());
  if (!invoiceId || !/^\d{4}-\d{2}-\d{2}$/.test(promisedDate) || promisedDate < today) throw new Error("Thông tin lịch hẹn thanh toán không hợp lệ.");
  if (!Number.isFinite(expectedAmount) || expectedAmount <= 0 || note.length > 300) throw new Error("Số tiền hoặc ghi chú không hợp lệ.");
  const ok = await createPaymentAgreement({ invoiceId, studentId: "", promisedDate, expectedAmount: Math.round(expectedAmount), note }, today);
  if (!ok) throw new Error("Không thể tạo lịch hẹn. Hãy kiểm tra hóa đơn và số tiền còn nợ.");
  revalidatePath("/admin/tuition/reminders");
  revalidatePath("/admin/tuition/debts");
  revalidatePath("/student/notifications");
  revalidatePath("/parent/notifications");
}
