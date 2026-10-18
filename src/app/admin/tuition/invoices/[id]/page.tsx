import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table } from "@/components/ui/Table";
import { formatVND } from "@/lib/format";
import { formatDate } from "@/lib/format-date";
import { monthLabel, toISODate } from "@/lib/month";
import { METHOD_LABEL, STATUS_LABEL } from "@/lib/tuition";
import { getInvoiceViewById, getPaymentsForInvoice } from "@/mocks/tuition";
import { DeletePaymentButton } from "../../_components/DeletePaymentButton";
import { PaymentForm } from "../../_components/PaymentForm";

export const metadata: Metadata = { title: "Hóa đơn học phí | Quản trị" };

async function InvoiceContent({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const today = toISODate(new Date());
  const invoice = await getInvoiceViewById(id, today);
  if (!invoice) notFound();
  const payments = await getPaymentsForInvoice(id);

  return (
    <>
      <PageHeader
        title={`Hóa đơn ${monthLabel(invoice.month)}`}
        subtitle={`${invoice.studentName} · Lớp ${invoice.className} · Hạn đóng ${formatDate(invoice.dueDate)}`}
        actions={
          <>
            <Button href={`/admin/students/${invoice.studentId}`}>Hồ sơ học sinh</Button>
            <Button href="/admin/tuition">Về danh sách</Button>
          </>
        }
      />

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))" }}>
        <StatCard label="Học phí" value={formatVND(invoice.amount)} hint={STATUS_LABEL[invoice.status]} />
        <StatCard label="Đã đóng" value={formatVND(invoice.paid)} hint={`${payments.length} lần thanh toán`} />
        <StatCard label="Còn lại" value={formatVND(invoice.remaining)} hint={invoice.remaining > 0 ? "Cần thu" : "Đã đóng đủ"} tone={invoice.remaining > 0 ? "warning" : "default"} />
      </div>

      <Card title="Ghi nhận thanh toán">
        {invoice.remaining > 0 ? (
          <PaymentForm key={invoice.remaining} invoiceId={invoice.id} remaining={invoice.remaining} today={today} />
        ) : (
          <p style={{ fontSize: 14 }}>
            <Badge>Đã đóng đủ</Badge> Hóa đơn này không còn số tiền cần thu.
          </p>
        )}
      </Card>

      <Card title="Lịch sử thanh toán">
        {payments.length === 0 ? (
          <EmptyState title="Chưa có khoản thu nào" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th scope="col">Ngày thu</th>
                <th scope="col">Số tiền</th>
                <th scope="col">Hình thức</th>
                <th scope="col">Ghi chú</th>
                <th scope="col">
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{formatDate(p.paidAt)}</td>
                  <td>
                    <strong>{formatVND(p.amount)}</strong>
                  </td>
                  <td>{METHOD_LABEL[p.method]}</td>
                  <td>{p.note || "-"}</td>
                  <td>
                    <DeletePaymentButton paymentId={p.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <p style={{ marginTop: 12, fontSize: 13, color: "var(--color-muted)" }}>
          Nhập nhầm? Xóa khoản thu rồi ghi nhận lại. Xem công nợ của cả trung tâm ở{" "}
          <Link href="/admin/tuition/debts">tab Công nợ</Link>.
        </p>
      </Card>
    </>
  );
}

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Đang tải hóa đơn...</p>}>
      <InvoiceContent params={params} />
    </Suspense>
  );
}
