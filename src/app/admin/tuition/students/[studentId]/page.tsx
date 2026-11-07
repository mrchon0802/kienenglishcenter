import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatVND } from "@/lib/format";
import { formatDate } from "@/lib/format-date";
import { monthLabel, toISODate } from "@/lib/month";
import { METHOD_LABEL, STATUS_LABEL } from "@/lib/tuition";
import { getStudentInvoiceViews, getStudentPayments } from "@/mocks/tuition";
import {
  getAdminTuitionNotifications,
  getPaymentAgreements,
} from "@/mocks/tuition-notifications";
import { getStudentById } from "@/mocks/students";
import { recordStudentPaymentAction } from "../../actions";
import styles from "./StudentDebt.module.css";

export const metadata: Metadata = { title: "Công nợ học sinh | Quản trị" };

async function StudentDebtContent({ studentId }: { studentId: string }) {
  await connection();
  const today = toISODate(new Date());
  const student = await getStudentById(studentId);
  if (!student) notFound();

  const [invoices, payments, notices, agreements] = await Promise.all([
    getStudentInvoiceViews(studentId, today),
    getStudentPayments(studentId),
    getAdminTuitionNotifications(1000),
    getPaymentAgreements(),
  ]);
  const outstanding = invoices.filter((item) => item.remaining > 0);
  const totalAmount = invoices.reduce((sum, item) => sum + item.amount, 0);
  const totalPaid = invoices.reduce((sum, item) => sum + item.paid, 0);
  const totalRemaining = invoices.reduce(
    (sum, item) => sum + item.remaining,
    0,
  );
  const oldestDue = outstanding.length
    ? [...outstanding].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
    : null;
  const studentNotices = notices.filter((item) => item.studentId === studentId);
  const studentAgreements = agreements.filter(
    (item) =>
      outstanding.some((invoice) => invoice.id === item.invoiceId) ||
      invoices.some((invoice) => invoice.id === item.invoiceId),
  );
  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    background: "var(--color-surface)",
  };
  const labelStyle = {
    display: "grid",
    gap: 6,
    fontSize: 13,
    fontWeight: 600 as const,
  };

  return (
    <>
      <PageHeader
        title={`Công nợ: ${student.fullName}`}
        subtitle={`${student.code} · Lớp ${student.className}`}
        actions={
          <>
            <Link href="/admin/tuition/debts">← Danh sách công nợ</Link>
            <Link href={`/admin/students/${studentId}`}>Hồ sơ học sinh</Link>
          </>
        }
      />

      <div
        style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,190px),1fr))",
        }}
      >
        <StatCard
          label="Tổng học phí"
          value={formatVND(totalAmount)}
          hint={`${invoices.length} hóa đơn`}
        />
        <StatCard
          label="Đã thanh toán"
          value={formatVND(totalPaid)}
          hint={`${payments.length} giao dịch`}
        />
        <StatCard
          label="Còn công nợ"
          value={formatVND(totalRemaining)}
          hint={`${outstanding.length} hóa đơn chưa tất toán`}
          tone={totalRemaining > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Nợ lâu nhất"
          value={oldestDue ? formatDate(oldestDue.dueDate) : "—"}
          hint={oldestDue ? monthLabel(oldestDue.month) : "Không có công nợ"}
        />
      </div>

      <Card>
        <div className={styles.section}>
          <div className={styles.paymentSummary}>
            <div>
              <h2 style={{ margin: 0, fontSize: 17 }}>
                Các hóa đơn của học sinh
              </h2>
              <p
                style={{
                  margin: "5px 0 0",
                  color: "var(--color-muted)",
                  fontSize: 13,
                }}
              >
                Theo dõi học phí, lịch thanh toán và số dư từng kỳ.
              </p>
            </div>

            <span className={styles.paymentCount}>
              {invoices.length} hóa đơn
            </span>
          </div>

          {invoices.length ? (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Kỳ học</th>
                    <th>Hạn đóng</th>
                    <th className={styles.right}>Học phí</th>
                    <th className={styles.right}>Đã đóng</th>
                    <th className={styles.right}>Còn nợ</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className={styles.period}>
                        {monthLabel(invoice.month)}
                      </td>

                      <td className={styles.date}>
                        {formatDate(invoice.dueDate)}
                      </td>

                      <td className={styles.right}>
                        {formatVND(invoice.amount)}
                      </td>

                      <td className={`${styles.right} ${styles.paidAmount}`}>
                        {formatVND(invoice.paid)}
                      </td>

                      <td className={`${styles.right} ${styles.amount}`}>
                        {formatVND(invoice.remaining)}
                      </td>

                      <td>
                        <Badge
                          tone={
                            invoice.remaining === 0
                              ? "teal"
                              : invoice.status === "overdue"
                                ? "amber"
                                : "teal"
                          }
                        >
                          {STATUS_LABEL[invoice.status]}
                        </Badge>
                      </td>

                      <td>
                        <Link
                          href={`/admin/tuition/invoices/${invoice.id}`}
                          className={styles.detailLink}
                        >
                          Chi tiết →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Học sinh chưa có hóa đơn học phí" />
          )}
        </div>
      </Card>

      {totalRemaining > 0 && (
        <Card title="Ghi nhận thanh toán nhiều hóa đơn">
          <p
            style={{ marginTop: 0, color: "var(--color-muted)", fontSize: 13 }}
          >
            Số tiền sẽ được tự động phân bổ vào hóa đơn có hạn thanh toán cũ
            nhất trước. Tổng công nợ hiện tại:{" "}
            <strong>{formatVND(totalRemaining)}</strong>.
          </p>
          <form
            action={recordStudentPaymentAction}
            style={{ display: "grid", gap: 14 }}
          >
            <input type="hidden" name="studentId" value={studentId} />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                gap: 12,
              }}
            >
              <label style={labelStyle}>
                Số tiền nhận (VNĐ)
                <input
                  name="amount"
                  type="number"
                  min="1"
                  max={totalRemaining}
                  step="1000"
                  required
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Ngày thu
                <input
                  name="paidAt"
                  type="date"
                  defaultValue={today}
                  max={today}
                  required
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Hình thức
                <select
                  name="method"
                  defaultValue="transfer"
                  style={inputStyle}
                >
                  <option value="transfer">Chuyển khoản</option>
                  <option value="cash">Tiền mặt</option>
                </select>
              </label>
            </div>
            <label style={labelStyle}>
              Ghi chú
              <input
                name="note"
                maxLength={200}
                placeholder="Ví dụ: Phụ huynh thanh toán gộp 2 kỳ"
                style={inputStyle}
              />
            </label>
            <div>
              <button
                type="submit"
                style={{
                  border: 0,
                  borderRadius: 8,
                  padding: "10px 16px",
                  background: "var(--color-primary)",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Ghi nhận và phân bổ thanh toán
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className={styles.section}>
          <div className={styles.paymentSummary}>
            <div>
              <h2 style={{ margin: 0, fontSize: 17 }}>Lịch sử thanh toán</h2>
              <p
                style={{
                  margin: "5px 0 0",
                  color: "var(--color-muted)",
                  fontSize: 13,
                }}
              >
                Theo dõi các giao dịch học phí đã ghi nhận.
              </p>
            </div>

            <span className={styles.paymentCount}>
              {payments.length} giao dịch
            </span>
          </div>

          {payments.length ? (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Ngày thu</th>
                    <th>Kỳ học</th>
                    <th className={styles.right}>Số tiền</th>
                    <th>Hình thức</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className={styles.date}>
                        {formatDate(payment.paidAt)}
                      </td>

                      <td className={styles.period}>
                        {monthLabel(payment.month)}
                      </td>

                      <td className={`${styles.right} ${styles.paidAmount}`}>
                        +{formatVND(payment.amount)}
                      </td>

                      <td>
                        <span className={styles.method}>
                          {METHOD_LABEL[payment.method]}
                        </span>
                      </td>

                      <td className={styles.note}>
                        {payment.note || "Không có ghi chú"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Chưa có giao dịch thanh toán" />
          )}
        </div>
      </Card>

      <Card title={`Lịch sử nhắc học phí (${studentNotices.length})`}>
        {studentNotices.length ? (
          <div style={{ display: "grid", gap: 10 }}>
            {studentNotices.map((notice) => (
              <article
                key={notice.id}
                style={{
                  padding: 12,
                  border: "1px solid var(--color-border)",
                  borderRadius: 9,
                }}
              >
                <strong>{notice.title}</strong>
                <p style={{ margin: "5px 0" }}>{notice.message}</p>
                <small style={{ color: "var(--color-muted)" }}>
                  {new Intl.DateTimeFormat("vi-VN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(notice.createdAt))}{" "}
                  · {notice.invoiceId}
                </small>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Chưa có lịch sử nhắc học phí" />
        )}
      </Card>

      <Card title={`Lịch hẹn thanh toán (${studentAgreements.length})`}>
        {studentAgreements.length ? (
          <div style={{ display: "grid", gap: 10 }}>
            {studentAgreements.map((agreement) => (
              <article
                key={agreement.id}
                style={{
                  padding: 12,
                  border: "1px solid var(--color-border)",
                  borderRadius: 9,
                }}
              >
                <strong>
                  {monthLabel(
                    invoices.find(
                      (invoice) => invoice.id === agreement.invoiceId,
                    )?.month ?? "",
                  )}
                </strong>
                <p style={{ margin: "5px 0" }}>
                  Ngày hẹn: {formatDate(agreement.promisedDate)} · Dự kiến:{" "}
                  {formatVND(agreement.expectedAmount)}
                </p>
                <small>{agreement.note || "Không có ghi chú"}</small>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Chưa có lịch hẹn thanh toán" />
        )}
      </Card>
    </>
  );
}

export default function StudentDebtPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  return (
    <Suspense fallback={<p>Đang tải hồ sơ công nợ...</p>}>
      <StudentDebtPageContent params={params} />
    </Suspense>
  );
}

async function StudentDebtPageContent({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <StudentDebtContent studentId={studentId} />;
}
