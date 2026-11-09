import { toISODate } from "@/lib/month";
import { syncTuitionReminderNotifications } from "@/mocks/tuition-notifications";
import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentStudentId } from "@/lib/current-user";
import { getStudentById } from "@/mocks/students";
import { getStudentInvoiceViews, getStudentPayments } from "@/mocks/tuition";
import { formatVND } from "@/lib/format";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Học phí và thanh toán | Kien English Center" };

function dateLabel(value: string) {
  const date = new Date(`${value.slice(0,10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", { day:"2-digit", month:"2-digit", year:"numeric" }).format(date);
}
function monthLabel(value: string) {
  const [year,month] = value.split("-");
  return month && year ? `Tháng ${month}/${year}` : value;
}
const statusLabel = { paid:"Đã thanh toán", partial:"Thanh toán một phần", unpaid:"Chưa thanh toán", overdue:"Quá hạn" } as const;

async function TuitionContent() {
  await connection();
  const currentStudentId = await getCurrentStudentId();
  const today = toISODate(new Date());
  await syncTuitionReminderNotifications(today);
  const student = await getStudentById(currentStudentId);
  if (!student) return <section className={styles.notice}><h1>Không tìm thấy hồ sơ học sinh</h1><p>Vui lòng liên hệ trung tâm.</p></section>;

  const [invoices,payments] = await Promise.all([
    getStudentInvoiceViews(student.id, today),
    getStudentPayments(student.id),
  ]);
  const billed = invoices.reduce((sum,item) => sum + item.amount,0);
  const paid = invoices.reduce((sum,item) => sum + item.paid,0);
  const remaining = invoices.reduce((sum,item) => sum + item.remaining,0);

  return <div className={styles.page}>
    <header className={styles.heading}><div><span className={styles.eyebrow}>PARENT PORTAL</span><h1>Học phí và thanh toán</h1><p>Xem các khoản học phí, số tiền đã thanh toán và lịch sử giao dịch.</p></div><div className={styles.student}><strong>{student.fullName}</strong><span>Lớp {student.className} · {student.code}</span></div></header>
    <section className={styles.stats}>
      <article className={styles.stat}><span>Tổng học phí</span><strong>{formatVND(billed)}</strong><small>{invoices.length} hóa đơn</small></article>
      <article className={styles.stat}><span>Đã thanh toán</span><strong>{formatVND(paid)}</strong><small>Tổng các khoản đã ghi nhận</small></article>
      <article className={styles.stat}><span>Còn phải thanh toán</span><strong>{formatVND(remaining)}</strong><small>Trên các hóa đơn hiện có</small></article>
      <article className={styles.stat}><span>Số giao dịch</span><strong>{payments.length}</strong><small>Lịch sử thanh toán</small></article>
    </section>
    <section className={styles.panel}>
      <div className={styles.panelHead}><div><h2>Hóa đơn học phí</h2><p>Chi tiết theo từng tháng học.</p></div></div>
      {invoices.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Kỳ học</th><th>Hạn thanh toán</th><th>Học phí</th><th>Đã đóng</th><th>Còn lại</th><th>Trạng thái</th></tr></thead><tbody>{invoices.map((item) => <tr key={item.id}><td>{monthLabel(item.month)}</td><td>{dateLabel(item.dueDate)}</td><td>{formatVND(item.amount)}</td><td>{formatVND(item.paid)}</td><td><strong>{formatVND(item.remaining)}</strong></td><td><span className={`${styles.pill} ${item.status === "overdue" ? styles.danger : item.status === "unpaid" ? styles.warning : ""}`}>{statusLabel[item.status]}</span></td></tr>)}</tbody></table></div> : <p className={styles.empty}>Chưa có hóa đơn học phí.</p>}
    </section>
    <section className={styles.panel}>
      <div className={styles.panelHead}><div><h2>Lịch sử thanh toán</h2><p>Các giao dịch đã được trung tâm ghi nhận.</p></div></div>
      {payments.length ? <ul className={styles.list}>{payments.map((payment) => <li key={payment.id}><span className={styles.info}><strong>{formatVND(payment.amount)}</strong><small>{monthLabel(payment.month)} · {dateLabel(payment.paidAt)}</small><small>Phương thức: {payment.method === "transfer" ? "Chuyển khoản" : "Tiền mặt"}{payment.note ? ` · ${payment.note}` : ""}</small></span><span className={styles.pill}>Đã ghi nhận</span></li>)}</ul> : <p className={styles.empty}>Chưa có giao dịch thanh toán.</p>}
    </section>
    <p className={styles.disclaimer}>Parent Portal chỉ cung cấp thông tin tra cứu. Phụ huynh không thể tạo giao dịch hoặc thanh toán trực tuyến tại đây. Nếu thông tin chưa chính xác, vui lòng liên hệ trung tâm.</p>
  </div>;
}

export default function ParentTuitionPage() {
  return <Suspense fallback={<div className={styles.loading}>Đang tải thông tin học phí...</div>}><TuitionContent /></Suspense>;
}
