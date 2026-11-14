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
import { getAdminTuitionNotifications, getPaymentAgreements } from "@/mocks/tuition-notifications";
import { DeletePaymentButton } from "../../_components/DeletePaymentButton";
import { PaymentForm } from "../../_components/PaymentForm";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Hóa đơn học phí | Quản trị" };

async function InvoiceContent({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const today = toISODate(new Date());
  const invoice = await getInvoiceViewById(id, today);
  if (!invoice) notFound();
  const [payments, allNotices, allAgreements] = await Promise.all([
    getPaymentsForInvoice(id),
    getAdminTuitionNotifications(500),
    getPaymentAgreements(),
  ]);
  const invoiceNotices = allNotices.filter((item) => item.invoiceId === id);
  const invoiceAgreements = allAgreements.filter((item) => item.invoiceId === id);
  const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

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

      <div className={styles.stats}>
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
        <div className={styles.desktopPayments}>
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
        </div>
        <div className={styles.mobilePayments}>
          {payments.map((payment) => (
            <article className={styles.paymentCard} key={`mobile-${payment.id}`}>
              <div className={styles.paymentTop}>
                <div>
                  <strong>{formatVND(payment.amount)}</strong>
                  <span>{formatDate(payment.paidAt)}</span>
                </div>
                <Badge>{METHOD_LABEL[payment.method]}</Badge>
              </div>
              {payment.note ? <p className={styles.paymentNote}>{payment.note}</p> : null}
              <div className={styles.paymentActions}>
                <DeletePaymentButton paymentId={payment.id} />
              </div>
            </article>
          ))}
          {payments.length === 0 ? <EmptyState title="Chưa có khoản thu nào" /> : null}
        </div>
        <p className={styles.note}>
          Nhập nhầm? Xóa khoản thu rồi ghi nhận lại. Xem công nợ của cả trung tâm ở{" "}
          <Link href="/admin/tuition/debts">tab Công nợ</Link>.
        </p>
      </Card>

      <Card title={`Lịch sử nhắc học phí (${invoiceNotices.length})`}>
        {invoiceNotices.length === 0 ? (
          <EmptyState title="Chưa có lịch sử nhắc học phí" />
        ) : (
          <div className={styles.activityList}>
            {invoiceNotices.map((notice) => (
              <article key={notice.id} className={styles.activityCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <strong>{notice.title}</strong>
                  <Badge tone={notice.kind === "overdue" ? "amber" : "teal"}>
                    {notice.kind === "reminder" ? "Nhắc lần đầu" : notice.kind === "due" ? "Đến hạn" : notice.kind === "overdue" ? "Quá hạn" : notice.kind === "payment" ? "Thanh toán" : "Lịch hẹn"}
                  </Badge>
                </div>
                <p style={{ margin: 0, fontSize: 14 }}>{notice.message}</p>
                <small style={{ color: "var(--color-muted)" }}>
                  {dateTimeFormatter.format(new Date(notice.createdAt))}
                </small>
              </article>
            ))}
          </div>
        )}
      </Card>

      <Card title={`Lịch hẹn thanh toán (${invoiceAgreements.length})`}>
        {invoiceAgreements.length === 0 ? (
          <EmptyState title="Chưa có lịch hẹn thanh toán" />
        ) : (
          <div className={styles.activityList}>
            {invoiceAgreements.map((agreement) => {
              const isPaid = invoice.remaining <= 0;
              const isWaiting = today < agreement.promisedDate;
              return (
                <article key={agreement.id} className={styles.activityCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <strong>Hẹn ngày {formatDate(agreement.promisedDate)}</strong>
                    <Badge tone={isPaid ? "teal" : "amber"}>
                      {isPaid ? "Đã thanh toán" : isWaiting ? "Đang chờ" : "Đã đến ngày hẹn"}
                    </Badge>
                  </div>
                  <p style={{ margin: 0 }}>Số tiền dự kiến: <strong>{formatVND(agreement.expectedAmount)}</strong></p>
                  {agreement.note ? <p style={{ margin: 0, color: "var(--color-muted)" }}>Ghi chú: {agreement.note}</p> : null}
                  <small style={{ color: "var(--color-muted)" }}>
                    Tạo lúc: {dateTimeFormatter.format(new Date(agreement.createdAt))}
                  </small>
                </article>
              );
            })}
          </div>
        )}
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
