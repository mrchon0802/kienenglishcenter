/**
 * Kho dữ liệu học phí GIẢ LẬP trong bộ nhớ server (globalThis), mất khi khởi động lại server.
 * Backend thật (NestJS + MongoDB) sẽ thay thế file này.
 */
import { addDays, addMonths, toISODate } from "@/lib/month";
import { computeStatus } from "@/lib/tuition";
import type {
  ClassRevenue,
  DebtorRow,
  Invoice,
  InvoiceView,
  MonthSummary,
  Payment,
  PaymentMethod,
} from "@/types/tuition";
import { getClasses } from "./classes";
import { getStudents } from "./students";

interface Store {
  invoices: Invoice[];
  payments: Payment[];
  counter: number;
}

const g = globalThis as unknown as { __ecTuitionStore?: Store };
const DUE_DAY = "10"; // hạn đóng học phí: ngày 10 hằng tháng

function studentNumber(id: string): number {
  return Number.parseInt(id.replace(/\D/g, ""), 10);
}

async function seed(): Promise<Store> {
  const today = toISODate(new Date());
  const current = today.slice(0, 7);
  const [students, classes] = await Promise.all([getStudents(), getClasses()]);
  const classByName = new Map(classes.map((c) => [c.name, c]));
  const store: Store = { invoices: [], payments: [], counter: 0 };

  for (let k = 5; k >= 0; k -= 1) {
    const month = addMonths(current, -k);
    const due = `${month}-${DUE_DAY}`;
    for (const student of students) {
      const cls = classByName.get(student.className);
      if (student.status !== "active" || !cls) continue;

      const n = studentNumber(student.id);
      const invoice: Invoice = {
        id: `inv-${month}-${student.id}`,
        studentId: student.id,
        classId: cls.id,
        month,
        amount: cls.monthlyFee,
        dueDate: due,
        createdAt: `${month}-01`,
      };
      store.invoices.push(invoice);

      // Kiểu thanh toán mẫu cố định theo học sinh và tháng.
      const pattern = (n * 7 + k * 3) % 10;
      const pay = (amount: number, paidAt: string) => {
        if (paidAt > today) return; // chưa tới ngày thì chưa có khoản thu
        store.counter += 1;
        store.payments.push({
          id: `pay-${store.counter}`,
          invoiceId: invoice.id,
          amount,
          method: n % 3 === 0 ? "transfer" : "cash",
          paidAt,
          note: "",
        });
      };

      if (pattern <= 6) pay(invoice.amount, addDays(due, -(n % 5)));
      else if (pattern === 7 && k >= 1) pay(Math.round(invoice.amount / 2 / 1000) * 1000, due);
      else if (pattern === 9) pay(invoice.amount, addDays(due, 6 + (n % 4)));
      // pattern 8 hoặc các trường hợp còn lại: chưa đóng
    }
  }
  return store;
}

async function store(): Promise<Store> {
  if (!g.__ecTuitionStore) g.__ecTuitionStore = await seed();
  return g.__ecTuitionStore;
}

// ---------- hóa đơn ----------
async function toViews(s: Store, today: string): Promise<InvoiceView[]> {
  const [students, classes] = await Promise.all([getStudents(), getClasses()]);
  const studentMap = new Map(students.map((x) => [x.id, x]));
  const classMap = new Map(classes.map((c) => [c.id, c]));

  const paidMap = new Map<string, { paid: number; last: string | null }>();
  for (const p of s.payments) {
    const entry = paidMap.get(p.invoiceId) ?? { paid: 0, last: null };
    entry.paid += p.amount;
    if (!entry.last || p.paidAt > entry.last) entry.last = p.paidAt;
    paidMap.set(p.invoiceId, entry);
  }

  return s.invoices.map((inv) => {
    const { paid, last } = paidMap.get(inv.id) ?? { paid: 0, last: null };
    const remaining = Math.max(0, inv.amount - paid);
    return {
      id: inv.id,
      studentId: inv.studentId,
      studentName: studentMap.get(inv.studentId)?.fullName ?? inv.studentId,
      classId: inv.classId,
      className: classMap.get(inv.classId)?.name ?? inv.classId,
      month: inv.month,
      amount: inv.amount,
      dueDate: inv.dueDate,
      paid,
      remaining,
      status: computeStatus(remaining, paid, inv.dueDate, today),
      lastPaidAt: last,
    };
  });
}

export async function getInvoiceViews(today: string): Promise<InvoiceView[]> {
  const views = await toViews(await store(), today);
  return views.sort((a, b) => b.month.localeCompare(a.month) || a.studentName.localeCompare(b.studentName, "vi"));
}

export async function getInvoiceViewById(id: string, today: string): Promise<InvoiceView | undefined> {
  return (await toViews(await store(), today)).find((v) => v.id === id);
}

export async function getPaymentsForInvoice(invoiceId: string): Promise<Payment[]> {
  const s = await store();
  return s.payments.filter((p) => p.invoiceId === invoiceId).sort((a, b) => b.paidAt.localeCompare(a.paidAt));
}

export async function createInvoicesForMonth(month: string): Promise<{ created: number; skipped: number }> {
  const s = await store();
  const [students, classes] = await Promise.all([getStudents(), getClasses()]);
  const classByName = new Map(classes.map((c) => [c.name, c]));
  const today = toISODate(new Date());
  let created = 0;
  let skipped = 0;

  for (const student of students) {
    const cls = classByName.get(student.className);
    if (student.status !== "active" || !cls) continue;
    const id = `inv-${month}-${student.id}`;
    if (s.invoices.some((inv) => inv.id === id)) {
      skipped += 1;
      continue;
    }
    s.invoices.push({ id, studentId: student.id, classId: cls.id, month, amount: cls.monthlyFee, dueDate: `${month}-${DUE_DAY}`, createdAt: today });
    created += 1;
  }
  return { created, skipped };
}

export async function addPayment(input: Omit<Payment, "id">): Promise<Payment> {
  const s = await store();
  s.counter += 1;
  const payment = { ...input, id: `pay-${s.counter}` };
  s.payments.push(payment);
  return payment;
}

/** Trả về id hóa đơn của khoản thu vừa xóa, hoặc null nếu không tìm thấy. */
export async function removePayment(paymentId: string): Promise<string | null> {
  const s = await store();
  const index = s.payments.findIndex((p) => p.id === paymentId);
  if (index === -1) return null;
  const [removed] = s.payments.splice(index, 1);
  return removed.invoiceId;
}

// ---------- cho học sinh ----------
export async function getStudentInvoiceViews(studentId: string, today: string): Promise<InvoiceView[]> {
  return (await getInvoiceViews(today)).filter((v) => v.studentId === studentId);
}

export async function getStudentPayments(studentId: string): Promise<(Payment & { month: string })[]> {
  const s = await store();
  const mine = new Map(s.invoices.filter((inv) => inv.studentId === studentId).map((inv) => [inv.id, inv.month]));
  return s.payments
    .filter((p) => mine.has(p.invoiceId))
    .map((p) => ({ ...p, month: mine.get(p.invoiceId) ?? "" }))
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
}

// ---------- công nợ và doanh thu ----------
export async function getDebtors(today: string): Promise<DebtorRow[]> {
  const views = (await getInvoiceViews(today)).filter((v) => v.remaining > 0);
  const byStudent = new Map<string, InvoiceView[]>();
  for (const v of views) byStudent.set(v.studentId, [...(byStudent.get(v.studentId) ?? []), v]);

  return [...byStudent.values()]
    .map((list) => {
      const oldest = [...list].sort((a, b) => a.month.localeCompare(b.month))[0];
      return {
        studentId: oldest.studentId,
        studentName: oldest.studentName,
        className: oldest.className,
        invoiceCount: list.length,
        oldestMonth: oldest.month,
        oldestInvoiceId: oldest.id,
        totalOwed: list.reduce((sum, v) => sum + v.remaining, 0),
        overdueAmount: list.filter((v) => v.status === "overdue").reduce((sum, v) => sum + v.remaining, 0),
      };
    })
    .sort((a, b) => b.totalOwed - a.totalOwed);
}

export async function getMonthSummaries(months: string[], today: string): Promise<MonthSummary[]> {
  const s = await store();
  const views = await toViews(s, today);
  return months.map((month) => {
    const monthViews = views.filter((v) => v.month === month);
    const invoiced = monthViews.reduce((sum, v) => sum + v.amount, 0);
    const outstanding = monthViews.reduce((sum, v) => sum + v.remaining, 0);
    const collected = s.payments.filter((p) => p.paidAt.startsWith(month)).reduce((sum, p) => sum + p.amount, 0);
    return { month, invoiced, collected, outstanding, collectionRate: invoiced > 0 ? (invoiced - outstanding) / invoiced : 0 };
  });
}

export async function getClassRevenue(month: string, today: string): Promise<ClassRevenue[]> {
  const views = (await getInvoiceViews(today)).filter((v) => v.month === month);
  const byClass = new Map<string, ClassRevenue>();
  for (const v of views) {
    const row = byClass.get(v.classId) ?? { classId: v.classId, className: v.className, invoiced: 0, paid: 0, outstanding: 0 };
    row.invoiced += v.amount;
    row.paid += v.paid;
    row.outstanding += v.remaining;
    byClass.set(v.classId, row);
  }
  return [...byClass.values()].sort((a, b) => a.className.localeCompare(b.className));
}

export type { PaymentMethod };
