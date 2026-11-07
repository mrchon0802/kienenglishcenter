import type { TuitionNotice, TuitionNoticeKind } from "@/types/tuition-notification";
import type { InvoiceView } from "@/types/tuition";
import { getInvoiceViews, getInvoiceViewById } from "@/mocks/tuition";
import { getTeacherAssignments } from "@/mocks/teacher-assignments";
import { createStudentSystemNotification } from "@/mocks/student-notifications";
import { formatVND } from "@/lib/format";
import { getTuitionReminderSettings } from "@/mocks/tuition-reminder-settings";

interface NoticeStore { items: TuitionNotice[]; counter: number; agreements: PaymentAgreement[] }
export interface PaymentAgreement {
  id: string; invoiceId: string; studentId: string; promisedDate: string;
  expectedAmount: number; note: string; createdAt: string;
}
const root = globalThis as typeof globalThis & { __ecTuitionNotices?: NoticeStore };
function store(): NoticeStore {
  if (!root.__ecTuitionNotices) root.__ecTuitionNotices = { items: [], counter: 0, agreements: [] };
  if (!root.__ecTuitionNotices.agreements) root.__ecTuitionNotices.agreements = [];
  return root.__ecTuitionNotices;
}
function dateForMonth(month: string, day: number) { return `${month}-${String(day).padStart(2, "0")}`; }
function daysBetween(from: string, to: string) {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  return Math.floor((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000);
}
function content(kind: TuitionNoticeKind, invoice: InvoiceView, today: string, settings: Awaited<ReturnType<typeof getTuitionReminderSettings>>) {
  const amount = formatVND(invoice.remaining);
  const monthText = `tháng ${invoice.month.slice(5, 7)}/${invoice.month.slice(0, 4)}`;
  const overdueDays = Math.max(0, daysBetween(invoice.dueDate, today));
  if (kind === "payment") return {
    title: invoice.remaining > 0 ? "Đã ghi nhận thanh toán học phí" : "Học phí đã được thanh toán đầy đủ",
    message: `${invoice.studentName} đã được ghi nhận thanh toán ${monthText}. Số tiền còn lại: ${amount}.`,
  };
  if (kind === "agreement") return {
    title: "Lịch hẹn thanh toán học phí",
    message: `Trung tâm đã ghi nhận lịch hẹn thanh toán ${monthText}. Vui lòng theo dõi ngày hẹn và thông tin từ trung tâm.`,
  };
  if (kind === "reminder") return {
    title: "Nhắc đóng học phí",
    message: `Học phí ${monthText} của ${invoice.studentName} còn ${amount}. Hạn thanh toán: ${invoice.dueDate}.`,
  };
  if (kind === "due") return {
    title: "Học phí đến hạn hôm nay",
    message: `Học phí ${monthText} của ${invoice.studentName} còn ${amount}. Vui lòng hoàn tất thanh toán trong hôm nay.`,
  };
  if (overdueDays >= settings.criticalDebtDays) return {
    title: "Cảnh báo công nợ nghiêm trọng",
    message: `${invoice.studentName} đang nợ học phí ${monthText} quá ${overdueDays} ngày. Số tiền còn thiếu: ${amount}. Vui lòng liên hệ Admin để thống nhất phương án xử lý.`,
  };
  if (overdueDays >= settings.overdueWarningDays) return {
    title: "Cảnh báo công nợ kéo dài",
    message: `${invoice.studentName} đang nợ học phí ${monthText} ${overdueDays} ngày. Số tiền còn thiếu: ${amount}. Vui lòng liên hệ trung tâm để xác nhận kế hoạch thanh toán.`,
  };
  return {
    title: "Thông báo nợ học phí quá hạn",
    message: `${invoice.studentName} còn nợ ${amount} học phí ${monthText}, đã quá hạn ${overdueDays} ngày. Vui lòng hoàn tất thanh toán.`,
  };
}
async function addNotice(input: Omit<TuitionNotice, "id" | "createdAt">) {
  const s = store();
  if (s.items.some((item) => item.sourceId === input.sourceId && item.audience === input.audience && item.recipientId === input.recipientId)) return;
  s.counter += 1;
  s.items.unshift({ ...input, id: `tn-${s.counter}`, createdAt: new Date().toISOString() });
}
async function publishForInvoice(invoice: InvoiceView, kind: TuitionNoticeKind, sourceId: string, today: string) {
  const settings = await getTuitionReminderSettings();
  const message = content(kind, invoice, today, settings);
  const title = message.title;
  const fullMessage = `${message.message} Lớp ${invoice.className}.`;
  await createStudentSystemNotification({
    studentId: invoice.studentId, sourceId: `tuition-${sourceId}`, category: "tuition",
    title, message: fullMessage, href: "/student/tuition",
  });
  await addNotice({
    audience: "admin", recipientId: "all-admins", studentId: invoice.studentId,
    invoiceId: invoice.id, classId: invoice.classId, title,
    message: `${fullMessage} Hạn đóng: ${invoice.dueDate}.`, kind, sourceId: `admin-${sourceId}`,
  });
  if (!settings.notifyTeachers) return;
  const assignments = await getTeacherAssignments();
  const activeTeachers = assignments.filter((item) => item.classId === invoice.classId && !item.endDate);
  for (const assignment of activeTeachers) {
    await addNotice({
      audience: "teacher", recipientId: assignment.teacherId, studentId: invoice.studentId,
      invoiceId: invoice.id, classId: invoice.classId, title,
      message: `${fullMessage} Hạn đóng: ${invoice.dueDate}.`, kind, sourceId: `teacher-${sourceId}`,
    });
  }
}
function scheduledReminder(invoice: InvoiceView, today: string, settings: Awaited<ReturnType<typeof getTuitionReminderSettings>>): { kind: TuitionNoticeKind; eventDate: string } | null {
  const first = dateForMonth(invoice.month, settings.firstReminderDay);
  const second = dateForMonth(invoice.month, settings.secondReminderDay);
  const followUp = dateForMonth(today.slice(0, 7), settings.followUpDay);
  if (today === first && today < invoice.dueDate) return { kind: "reminder", eventDate: first };
  if (today === invoice.dueDate) return { kind: "due", eventDate: invoice.dueDate };
  if (today === second && today > invoice.dueDate) return { kind: "overdue", eventDate: second };
  if (today.slice(0, 7) > invoice.month && today === followUp && today > invoice.dueDate) {
    return { kind: "overdue", eventDate: followUp };
  }
  return null;
}
export async function syncTuitionReminderNotifications(today: string): Promise<number> {
  const before = store().items.length;
  const [invoices, settings] = await Promise.all([getInvoiceViews(today), getTuitionReminderSettings()]);
  for (const invoice of invoices) {
    if (invoice.remaining <= 0) continue;
    const agreement = store().agreements.filter((item) => item.invoiceId === invoice.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    if (agreement && settings.pauseDuringAgreement && today < agreement.promisedDate) continue;
    let reminder = scheduledReminder(invoice, today, settings);
    if (agreement && settings.pauseDuringAgreement && today === agreement.promisedDate) {
      reminder = { kind: "overdue", eventDate: `agreement-${agreement.promisedDate}` };
    }
    if (!reminder) continue;
    await publishForInvoice(invoice, reminder.kind, `${invoice.id}-${reminder.kind}-${reminder.eventDate}`, today);
  }
  return store().items.length - before;
}
export async function sendManualTuitionReminders(today: string): Promise<number> {
  const before = store().items.length;
  const invoices = (await getInvoiceViews(today)).filter((item) => item.remaining > 0);
  for (const invoice of invoices) {
    const sourceId = `${invoice.id}-manual-${today}`;
    await publishForInvoice(invoice, invoice.status === "overdue" ? "overdue" : "reminder", sourceId, today);
  }
  return store().items.length - before;
}
export async function notifyTuitionPayment(invoiceId: string, paymentId: string, today: string): Promise<void> {
  const invoice = await getInvoiceViewById(invoiceId, today);
  if (invoice) await publishForInvoice(invoice, "payment", `${invoice.id}-payment-${paymentId}`, today);
}
export async function createPaymentAgreement(input: Omit<PaymentAgreement, "id" | "createdAt">, today: string): Promise<boolean> {
  const invoice = await getInvoiceViewById(input.invoiceId, today);
  if (!invoice || invoice.remaining <= 0 || input.expectedAmount <= 0 || input.expectedAmount > invoice.remaining || input.promisedDate < today) return false;
  const s = store();
  const createdAt = new Date().toISOString();
  const agreement: PaymentAgreement = { ...input, studentId: invoice.studentId, id: `agreement-${input.invoiceId}-${createdAt}`, createdAt };
  s.agreements.push(agreement);
  await publishForInvoice(invoice, "agreement", `${invoice.id}-agreement-${input.promisedDate}`, today);
  return true;
}
export async function getPaymentAgreements(): Promise<PaymentAgreement[]> {
  return [...store().agreements].sort((a, b) => a.promisedDate.localeCompare(b.promisedDate));
}
export async function getAdminTuitionNotifications(limit = 100): Promise<TuitionNotice[]> {
  return store().items.filter((item) => item.audience === "admin").slice(0, limit);
}
export async function getTeacherTuitionNotifications(teacherId: string, limit = 100): Promise<TuitionNotice[]> {
  const assignments = await getTeacherAssignments();
  const allowedClassIds = new Set(assignments.filter((item) => item.teacherId === teacherId && !item.endDate).map((item) => item.classId));
  return store().items.filter((item) => item.audience === "teacher" && item.recipientId === teacherId && allowedClassIds.has(item.classId)).slice(0, limit);
}
