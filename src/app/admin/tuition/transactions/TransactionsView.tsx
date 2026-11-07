"use client";

import { useMemo, useState, useTransition, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatVND } from "@/lib/format";
import { METHOD_LABEL } from "@/lib/tuition";
import { updatePaymentReconciliationAction } from "@/app/admin/tuition/actions";
import type { getPaymentTransactions } from "@/mocks/tuition";
import type {
  PaymentReconciliation,
  ReconciliationStatus,
} from "@/types/tuition-reconciliation";
import { RECONCILIATION_STATUS_LABEL } from "@/types/tuition-reconciliation";
import styles from "./TransactionsView.module.css";

type Transaction = Awaited<ReturnType<typeof getPaymentTransactions>>[number];

interface Props {
  transactions: Transaction[];
  reconciliations: Record<string, PaymentReconciliation>;
}

function ReconciliationControl({
  paymentId,
  record,
}: {
  paymentId: string;
  record?: PaymentReconciliation;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<ReconciliationStatus>(
    record?.status ?? "pending",
  );
  const [note, setNote] = useState(record?.note ?? "");
  const [message, setMessage] = useState("");

  function save() {
    setMessage("");
    startTransition(async () => {
      const result = await updatePaymentReconciliationAction({
        paymentId,
        status,
        note,
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage("Đã lưu đối soát.");
      router.refresh();
    });
  }

  const statusClass =
    status === "reconciled"
      ? styles.reconciled
      : status === "needs_review"
        ? styles.needsReview
        : styles.pending;
  return (
    <div className={styles.reconciliation}>
      <span className={`${styles.status} ${statusClass}`}>
        {RECONCILIATION_STATUS_LABEL[status]}
      </span>
      <select
        aria-label={`Trạng thái đối soát ${paymentId}`}
        value={status}
        onChange={(e) => setStatus(e.target.value as ReconciliationStatus)}
        disabled={isPending}
      >
        <option value="pending">Chưa đối soát</option>
        <option value="reconciled">Đã đối soát</option>
        <option value="needs_review">Cần kiểm tra</option>
      </select>
      <input
        aria-label={`Ghi chú đối soát ${paymentId}`}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ghi chú..."
        maxLength={300}
        disabled={isPending}
      />
      <button type="button" onClick={save} disabled={isPending}>
        {isPending ? "Đang lưu..." : "Lưu"}
      </button>
      {record?.updatedAt ? (
        <small className={styles.historyInfo}>
          Cập nhật: {new Date(record.updatedAt).toLocaleString("vi-VN")} ·{" "}
          {record.updatedBy} · {record.history.length} lần
        </small>
      ) : null}
      {message ? (
        <small className={styles.feedback} role="status">
          {message}
        </small>
      ) : null}
    </div>
  );
}

export function TransactionsView({ transactions, reconciliations }: Props) {
  const [keyword, setKeyword] = useState("");
  const [method, setMethod] = useState<"all" | "cash" | "transfer">("all");
  const [status, setStatus] = useState<"all" | ReconciliationStatus>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filtered = useMemo(() => {
    const q = keyword.trim().toLocaleLowerCase("vi");

    return transactions
      .filter((item) => {
        const reconciliationStatus =
          reconciliations[item.id]?.status ?? "pending";

        const text = [
          item.id,
          item.studentId,
          item.studentName,
          item.className,
          item.invoiceId,
          item.note,
        ]
          .join(" ")
          .toLocaleLowerCase("vi");

        return (
          (!q || text.includes(q)) &&
          (method === "all" || item.method === method) &&
          (status === "all" || reconciliationStatus === status) &&
          (!fromDate || item.paidAt >= fromDate) &&
          (!toDate || item.paidAt <= toDate)
        );
      })
      .sort((a, b) => {
        // Sắp xếp lớp theo số lớp: 1A, 1B, 2A, 2B...
        const classCompare = a.className.localeCompare(b.className, "vi", {
          numeric: true,
          sensitivity: "base",
        });

        if (classCompare !== 0) return classCompare;

        // Trong cùng lớp, sắp xếp theo tên học sinh.
        const studentCompare = a.studentName.localeCompare(
          b.studentName,
          "vi",
          { sensitivity: "base" },
        );

        if (studentCompare !== 0) return studentCompare;

        // Nếu cùng học sinh, giao dịch mới nhất lên trước.
        return b.paidAt.localeCompare(a.paidAt);
      });
  }, [
    transactions,
    reconciliations,
    keyword,
    method,
    status,
    fromDate,
    toDate,
  ]);

  const total = filtered.reduce((sum, item) => sum + item.amount, 0);
  const cashTotal = filtered
    .filter((item) => item.method === "cash")
    .reduce((sum, item) => sum + item.amount, 0);
  const transferTotal = filtered
    .filter((item) => item.method === "transfer")
    .reduce((sum, item) => sum + item.amount, 0);
  const reconciledCount = filtered.filter(
    (item) => reconciliations[item.id]?.status === "reconciled",
  ).length;
  const pendingCount = filtered.filter(
    (item) =>
      !reconciliations[item.id] ||
      reconciliations[item.id].status === "pending",
  ).length;
  const reviewCount = filtered.filter(
    (item) => reconciliations[item.id]?.status === "needs_review",
  ).length;

  function exportCSV() {
    const headers = [
      "Mã giao dịch",
      "Ngày thu",
      "Mã học sinh",
      "Tên học sinh",
      "Lớp",
      "Tháng học phí",
      "Mã hóa đơn",
      "Số tiền",
      "Hình thức",
      "Trạng thái đối soát",
      "Ghi chú đối soát",
      "Ghi chú giao dịch",
    ];
    const quote = (value: string | number) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = filtered.map((item) => [
      item.id,
      item.paidAt,
      item.studentId,
      item.studentName,
      item.className,
      item.month,
      item.invoiceId,
      item.amount,
      METHOD_LABEL[item.method],
      RECONCILIATION_STATUS_LABEL[
        reconciliations[item.id]?.status ?? "pending"
      ],
      reconciliations[item.id]?.note ?? "",
      item.note,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(quote).join(","))
      .join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `giao-dich-doi-soat-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.container}>
      <div className={styles.stats}>
        <StatCard
          label="Tổng tiền thực thu"
          value={formatVND(total)}
          hint={`${filtered.length} giao dịch`}
        />
        <StatCard
          label="Tiền mặt"
          value={formatVND(cashTotal)}
          hint="Theo bộ lọc hiện tại"
        />
        <StatCard
          label="Chuyển khoản"
          value={formatVND(transferTotal)}
          hint="Theo bộ lọc hiện tại"
        />
      </div>
      <div className={styles.stats}>
        <StatCard
          label="Đã đối soát"
          value={String(reconciledCount)}
          hint="Giao dịch đã xác nhận"
        />
        <StatCard
          label="Chưa đối soát"
          value={String(pendingCount)}
          hint="Cần thực hiện đối soát"
        />
        <StatCard
          label="Cần kiểm tra"
          value={String(reviewCount)}
          hint="Có thông tin cần xác minh"
          tone={reviewCount ? "warning" : "default"}
        />
      </div>
      <Card title="Bộ lọc giao dịch">
        <div className={styles.filters}>
          <label className={styles.search}>
            Tìm kiếm
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tên, mã học sinh, lớp, hóa đơn..."
            />
          </label>
          <label>
            Hình thức
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as typeof method)}
            >
              <option value="all">Tất cả</option>
              <option value="cash">Tiền mặt</option>
              <option value="transfer">Chuyển khoản</option>
            </select>
          </label>
          <label>
            Đối soát
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chưa đối soát</option>
              <option value="reconciled">Đã đối soát</option>
              <option value="needs_review">Cần kiểm tra</option>
            </select>
          </label>
          <label>
            Từ ngày
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </label>
          <label>
            Đến ngày
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => setToDate(e.target.value)}
            />
          </label>
          <div className={styles.filterActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                setKeyword("");
                setMethod("all");
                setStatus("all");
                setFromDate("");
                setToDate("");
              }}
            >
              Xóa bộ lọc
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={exportCSV}
              disabled={!filtered.length}
            >
              Xuất CSV
            </button>
          </div>
        </div>
      </Card>
      <Card title="Danh sách giao dịch">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ngày thu</th>
                <th>Học sinh</th>
                <th>Lớp</th>
                <th>Hóa đơn</th>
                <th>Hình thức</th>
                <th>Số tiền</th>
                <th>Đối soát</th>
                <th>Ghi chú</th>
                <th>Thao tác đối soát</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, index) => {
                const currentStatus =
                  reconciliations[item.id]?.status ?? "pending";

                const statusClass =
                  currentStatus === "reconciled"
                    ? styles.reconciled
                    : currentStatus === "needs_review"
                      ? styles.needsReview
                      : styles.pending;

                const isNewClass =
                  index === 0 ||
                  filtered[index - 1].className !== item.className;

                const classCount = filtered.filter(
                  (transaction) => transaction.className === item.className,
                ).length;

                return (
                  <Fragment key={item.id}>
                    {isNewClass && (
                      <tr className={styles.classHeader}>
                        <td colSpan={9}>
                          <div className={styles.classHeaderContent}>
                            <strong>{item.className}</strong>
                            <span>{classCount} giao dịch</span>
                          </div>
                        </td>
                      </tr>
                    )}

                    <tr>
                      <td className={styles.nowrap}>{item.paidAt}</td>

                      <td>
                        <strong>{item.studentName}</strong>
                        <small className={styles.subText}>
                          {item.studentId}
                        </small>
                      </td>

                      <td>{item.className}</td>

                      <td>
                        {item.invoiceId}
                        <small className={styles.subText}>{item.month}</small>
                      </td>

                      <td>{METHOD_LABEL[item.method]}</td>

                      <td className={styles.amount}>
                        {formatVND(item.amount)}
                      </td>

                      <td>
                        <span className={`${styles.status} ${statusClass}`}>
                          {RECONCILIATION_STATUS_LABEL[currentStatus]}
                        </span>
                      </td>

                      <td className={styles.note}>{item.note || "—"}</td>

                      <td>
                        <ReconciliationControl
                          paymentId={item.id}
                          record={reconciliations[item.id]}
                        />
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
