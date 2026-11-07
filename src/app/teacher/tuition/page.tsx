import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { getCurrentTeacherId } from "@/lib/current-user";
import { formatVND } from "@/lib/format";
import { toISODate, monthLabel } from "@/lib/month";
import { getInvoiceViews } from "@/mocks/tuition";
import { getTeacherAssignments } from "@/mocks/teacher-assignments";
import { getTeacherTuitionNotifications, syncTuitionReminderNotifications } from "@/mocks/tuition-notifications";

export const metadata = { title: "Thông báo học phí | Giáo viên" };

async function TuitionContent() {
  await connection();
  const today = toISODate(new Date());
  await syncTuitionReminderNotifications(today);
  const teacherId = await getCurrentTeacherId();
  const assignments = await getTeacherAssignments();
  const classIds = new Set(assignments.filter((item) => item.teacherId === teacherId && !item.endDate).map((item) => item.classId));
  const [invoices, notices] = await Promise.all([
    getInvoiceViews(today),
    getTeacherTuitionNotifications(teacherId),
  ]);
  const debts = invoices.filter((item) => classIds.has(item.classId) && item.remaining > 0);
  const overdue = debts.filter((item) => item.status === "overdue");
  return <div style={{ display: "grid", gap: 20 }}>
    <section style={{ display: "grid", gap: 8, padding: 20, borderRadius: 14, background: "var(--color-surface, #fff)", border: "1px solid var(--color-border)" }}>
      <h2 style={{ margin: 0 }}>Tình hình học phí các lớp phụ trách</h2>
      <p style={{ margin: 0, color: "var(--color-muted)" }}>Bạn chỉ xem được học sinh thuộc lớp đang được phân công. Không thể chỉnh sửa hóa đơn hoặc ghi nhận thanh toán.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}><strong>{debts.length} học sinh còn nợ</strong><strong>{overdue.length} học sinh quá hạn</strong></div>
    </section>
    <section style={{ padding: 20, borderRadius: 14, background: "var(--color-surface, #fff)", border: "1px solid var(--color-border)" }}>
      <h2 style={{ marginTop: 0 }}>Danh sách học sinh còn nợ</h2>
      {debts.length ? <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th align="left">Học sinh</th><th align="left">Lớp</th><th align="left">Kỳ học</th><th align="left">Hạn đóng</th><th align="right">Còn nợ</th><th align="left">Trạng thái</th></tr></thead><tbody>{debts.map((item) => <tr key={item.id}><td>{item.studentName}</td><td>{item.className}</td><td>{monthLabel(item.month)}</td><td>{item.dueDate}</td><td align="right"><strong>{formatVND(item.remaining)}</strong></td><td>{item.status === "overdue" ? "Quá hạn" : item.status === "partial" ? "Đã đóng một phần" : "Chưa đến hạn"}</td></tr>)}</tbody></table></div> : <p>Hiện không có học sinh còn nợ trong các lớp bạn phụ trách.</p>}
    </section>
    <section style={{ padding: 20, borderRadius: 14, background: "var(--color-surface, #fff)", border: "1px solid var(--color-border)" }}>
      <h2 style={{ marginTop: 0 }}>Thông báo học phí gần đây</h2>
      {notices.length ? <div style={{ display: "grid", gap: 12 }}>{notices.map((item) => <article key={item.id} style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: 10 }}><strong>{item.title}</strong><p style={{ margin: "4px 0", color: "var(--color-muted)" }}>{item.message}</p><small>{new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</small></article>)}</div> : <p>Chưa có thông báo học phí.</p>}
    </section>
  </div>;
}
export default function TeacherTuitionPage() {
  return <><PageHeader title="Thông báo học phí" subtitle="Theo dõi tình trạng học phí của học sinh trong lớp bạn phụ trách." /><Suspense fallback={<p>Đang tải thông tin học phí...</p>}><TuitionContent /></Suspense></>;
}
