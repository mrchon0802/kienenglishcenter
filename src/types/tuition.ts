export type PaymentMethod = "cash" | "transfer";
/** overdue: còn nợ và đã quá hạn đóng; partial: đã đóng một phần; unpaid: chưa đóng, chưa quá hạn. */
export type InvoiceStatus = "paid" | "partial" | "unpaid" | "overdue";

/** Hóa đơn học phí: mỗi học sinh một hóa đơn cho mỗi tháng. */
export interface Invoice {
  id: string;
  studentId: string;
  classId: string;
  month: string; // "2026-10"
  amount: number; // VNĐ, lấy từ học phí của lớp lúc tạo hóa đơn
  dueDate: string; // "yyyy-mm-dd"
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string; // "yyyy-mm-dd"
  note: string;
}

export interface InvoiceView {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  month: string;
  amount: number;
  dueDate: string;
  paid: number;
  remaining: number;
  status: InvoiceStatus;
  lastPaidAt: string | null;
}

export interface DebtorRow {
  studentId: string;
  studentName: string;
  className: string;
  invoiceCount: number;
  oldestMonth: string;
  oldestInvoiceId: string;
  totalOwed: number;
  overdueAmount: number;
}

export interface MonthSummary {
  month: string;
  invoiced: number; // tổng học phí các hóa đơn của tháng
  collected: number; // tiền thực thu trong tháng (theo ngày thanh toán)
  outstanding: number; // còn nợ của các hóa đơn tháng đó
  collectionRate: number; // 0..1: phần hóa đơn tháng đó đã thu
}

export interface ClassRevenue {
  classId: string;
  className: string;
  invoiced: number;
  paid: number;
  outstanding: number;
}
