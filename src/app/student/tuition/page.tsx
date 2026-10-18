import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table } from "@/components/ui/Table";
import { formatVND } from "@/lib/format";
import { formatDate } from "@/lib/format-date";
import { monthLabel, toISODate } from "@/lib/month";
import { METHOD_LABEL, STATUS_LABEL } from "@/lib/tuition";
import { CURRENT_STUDENT_ID } from "@/mocks/session";
import { getStudentInvoiceViews, getStudentPayments } from "@/mocks/tuition";

export const metadata: Metadata = { title: "Học phí | Học sinh" };

async function TuitionContent() {
  await connection();
  const today = toISODate(new Date());
  const [invoices, payments] = await Promise.all([
    getStudentInvoiceViews(CURRENT_STUDENT_ID, today),
    getStudentPayments(CURRENT_STUDENT_ID),
  ]);
  const owed = invoices.reduce((sum, v) => sum + v.remaining, 0);
  const overdue = invoices.filter((v) => v.status === "overdue").reduce((sum, v) => sum + v.remaining, 0);

  return (
    <>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))" }}>
        <StatCard
          label="Còn phải đóng"
          value={owed > 0 ? formatVND(owed) : "Đã đóng đủ"}
          hint={owed > 0 ? "Nhờ ba mẹ đóng tại trung tâm nhé" : "Em không còn nợ học phí"}
          tone={owed > 0 ? "warning" : "default"}
        />
        <StatCard label="Quá hạn" value={overdue > 0 ? formatVND(overdue) : "Không có"} hint="Hạn đóng là ngày 10 hằng tháng" tone={overdue > 0 ? "warning" : "default"} />
      </div>

      <Card title="Học phí từng tháng">
        {invoices.length === 0 ? (
          <EmptyState title="Chưa có hóa đơn nào" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th scope="col">Tháng</th>
                <th scope="col">Học phí</th>
                <th scope="col">Đã đóng</th>
                <th scope="col">Còn lại</th>
                <th scope="col">Hạn đóng</th>
                <th scope="col">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((v) => (
                <tr key={v.id}>
                  <td>{monthLabel(v.month)}</td>
                  <td>{formatVND(v.amount)}</td>
                  <td>{formatVND(v.paid)}</td>
                  <td>{v.remaining > 0 ? <strong>{formatVND(v.remaining)}</strong> : "-"}</td>
                  <td>{formatDate(v.dueDate)}</td>
                  <td>
                    <Badge tone={v.status === "paid" ? "teal" : "amber"}>{STATUS_LABEL[v.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card title="Các lần đã đóng">
        {payments.length === 0 ? (
          <EmptyState title="Chưa có lần đóng nào" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th scope="col">Ngày đóng</th>
                <th scope="col">Cho tháng</th>
                <th scope="col">Số tiền</th>
                <th scope="col">Hình thức</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{formatDate(p.paidAt)}</td>
                  <td>{monthLabel(p.month)}</td>
                  <td>
                    <strong>{formatVND(p.amount)}</strong>
                  </td>
                  <td>{METHOD_LABEL[p.method]}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <p style={{ marginTop: 12, fontSize: 13, color: "var(--color-muted)" }}>
          Học phí được đóng trực tiếp tại trung tâm. Sau khi đóng, giáo viên sẽ ghi vào hệ thống và hiện ở đây.
        </p>
      </Card>
    </>
  );
}

export default function StudentTuitionPage() {
  return (
    <>
      <PageHeader title="Học phí" subtitle="Học phí và các lần đã đóng của em" />
      <Suspense fallback={<p>Đang tải học phí...</p>}>
        <TuitionContent />
      </Suspense>
    </>
  );
}
