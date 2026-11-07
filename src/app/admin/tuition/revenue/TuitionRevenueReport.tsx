"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { BarChart } from "@/components/dashboard/BarChart";
import { formatNumber, formatVND } from "@/lib/format";
import { METHOD_LABEL } from "@/lib/tuition";
import type { InvoiceView, PaymentMethod } from "@/types/tuition";
import type { PaymentReconciliation } from "@/types/tuition-reconciliation";
import styles from "./TuitionRevenueReport.module.css";

type Transaction = {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  note: string;
  studentId: string;
  studentName: string;
  className: string;
  month: string;
};

type Period = "month" | "quarter" | "year" | "custom";
type Mode = "actual" | "reconciled";

interface Props {
  today: string;
  invoices: InvoiceView[];
  transactions: Transaction[];
  reconciliations: Record<string, PaymentReconciliation>;
}

function monthStart(date: string) {
  return `${date.slice(0, 7)}-01`;
}

function getInitialRange(today: string) {
  const date = new Date(`${today}T12:00:00`);
  date.setMonth(date.getMonth() - 5);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function csvCell(value: string | number) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function TuitionRevenueReport({
  today,
  invoices,
  transactions,
  reconciliations,
}: Props) {
  const [period, setPeriod] = useState<Period>("custom");
  const [mode, setMode] = useState<Mode>("actual");
  const [fromDate, setFromDate] = useState(getInitialRange(today));
  const [toDate, setToDate] = useState(today);

  const range = useMemo(() => {
    if (period === "month") return { from: monthStart(today), to: today };
    if (period === "quarter") {
      const d = new Date(`${today}T12:00:00`);
      const firstMonth = Math.floor(d.getMonth() / 3) * 3;
      return {
        from: `${d.getFullYear()}-${String(firstMonth + 1).padStart(2, "0")}-01`,
        to: today,
      };
    }
    if (period === "year")
      return { from: `${today.slice(0, 4)}-01-01`, to: today };
    return { from: fromDate, to: toDate };
  }, [period, today, fromDate, toDate]);

  const visibleTransactions = useMemo(
    () =>
      transactions.filter((item) => {
        const inRange = item.paidAt >= range.from && item.paidAt <= range.to;
        const reconciled = reconciliations[item.id]?.status === "reconciled";
        return inRange && (mode === "actual" || reconciled);
      }),
    [transactions, reconciliations, range, mode],
  );

  const visibleInvoices = useMemo(
    () =>
      invoices.filter((item) => {
        const invoiceDate = `${item.month}-01`;
        return (
          invoiceDate >= range.from.slice(0, 7) + "-01" &&
          invoiceDate <= range.to.slice(0, 7) + "-01"
        );
      }),
    [invoices, range],
  );

  const totalCollected = visibleTransactions.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const cashTotal = visibleTransactions
    .filter((item) => item.method === "cash")
    .reduce((sum, item) => sum + item.amount, 0);
  const transferTotal = visibleTransactions
    .filter((item) => item.method === "transfer")
    .reduce((sum, item) => sum + item.amount, 0);

  const invoicePaid = useMemo(() => {
    const byInvoice = new Map<string, number>();
    for (const payment of transactions) {
      if (
        mode === "reconciled" &&
        reconciliations[payment.id]?.status !== "reconciled"
      )
        continue;
      byInvoice.set(
        payment.invoiceId,
        (byInvoice.get(payment.invoiceId) ?? 0) + payment.amount,
      );
    }
    return byInvoice;
  }, [transactions, reconciliations, mode]);

  const invoiced = visibleInvoices.reduce((sum, item) => sum + item.amount, 0);
  const allocatedCollected = visibleInvoices.reduce(
    (sum, item) => sum + Math.min(item.amount, invoicePaid.get(item.id) ?? 0),
    0,
  );
  const outstanding = Math.max(0, invoiced - allocatedCollected);
  const collectionRate = invoiced > 0 ? allocatedCollected / invoiced : 0;
  const reconciledCount = visibleTransactions.filter(
    (item) => reconciliations[item.id]?.status === "reconciled",
  ).length;
  const pendingCount = visibleTransactions.filter(
    (item) =>
      !reconciliations[item.id] ||
      reconciliations[item.id].status === "pending",
  ).length;
  const reviewCount = visibleTransactions.filter(
    (item) => reconciliations[item.id]?.status === "needs_review",
  ).length;

  const monthlyRows = useMemo(() => {
    const map = new Map<string, number>();
    for (const payment of visibleTransactions) {
      const month = payment.paidAt.slice(0, 7);
      map.set(month, (map.get(month) ?? 0) + payment.amount);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [visibleTransactions]);

  const classRows = useMemo(() => {
    const map = new Map<string, { collected: number; count: number }>();
    for (const payment of visibleTransactions) {
      const row = map.get(payment.className) ?? { collected: 0, count: 0 };
      row.collected += payment.amount;
      row.count += 1;
      map.set(payment.className, row);
    }
    return [...map.entries()]
      .map(([className, value]) => ({ className, ...value }))
      .sort((a, b) =>
        a.className.localeCompare(b.className, "vi", { numeric: true }),
      );
  }, [visibleTransactions]);

  const methodRows = [
    { method: "cash" as const, amount: cashTotal },
    { method: "transfer" as const, amount: transferTotal },
  ];

  function exportCSV() {
    const headers = [
      "Ngày thu",
      "Mã giao dịch",
      "Học sinh",
      "Mã học sinh",
      "Lớp",
      "Tháng hóa đơn",
      "Mã hóa đơn",
      "Hình thức",
      "Số tiền",
      "Trạng thái đối soát",
    ];
    const rows = visibleTransactions.map((item) => [
      item.paidAt,
      item.id,
      item.studentName,
      item.studentId,
      item.className,
      item.month,
      item.invoiceId,
      METHOD_LABEL[item.method],
      item.amount,
      reconciliations[item.id]?.status ?? "pending",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bao-cao-thu-hoc-phi-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.container}>
      <Card title="Phạm vi báo cáo">
        <div className={styles.controls}>
          <label>
            <span>Khoảng thời gian</span>
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value as Period)}
            >
              <option value="month">Tháng này</option>
              <option value="quarter">Quý này</option>
              <option value="year">Năm nay</option>
              <option value="custom">Tùy chọn ngày</option>
            </select>
          </label>

          <label>
            <span>Từ ngày</span>
            <input
              type="date"
              value={range.from}
              disabled={period !== "custom"}
              max={range.to}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </label>

          <label>
            <span>Đến ngày</span>
            <input
              type="date"
              value={range.to}
              disabled={period !== "custom"}
              min={range.from}
              max={today}
              onChange={(event) => setToDate(event.target.value)}
            />
          </label>

          <label>
            <span>Chế độ báo cáo</span>
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as Mode)}
            >
              <option value="actual">Tất cả khoản thu đã ghi nhận</option>
              <option value="reconciled">Chỉ khoản thu đã đối soát</option>
            </select>
          </label>

          <button
            type="button"
            className={styles.exportButton}
            onClick={exportCSV}
            disabled={!visibleTransactions.length}
          >
            Xuất CSV giao dịch
          </button>
        </div>

        <p className={styles.note}>
          Thực thu được tính theo ngày nhận tiền. Phải thu và công nợ được tính
          theo tháng ghi trên hóa đơn.
          {mode === "reconciled"
            ? " Chế độ đối soát chỉ tính các khoản đã xác nhận."
            : ""}
        </p>
      </Card>

      <div className={styles.stats}>
        <StatCard
          label="Tổng học phí phải thu"
          value={formatVND(invoiced)}
          hint="Theo tháng hóa đơn trong phạm vi báo cáo"
        />
        <StatCard
          label="Tiền thực thu"
          value={formatVND(totalCollected)}
          hint={`${visibleTransactions.length} giao dịch theo ngày thu`}
        />
        <StatCard
          label="Còn nợ"
          value={formatVND(outstanding)}
          hint="Phải thu trừ khoản đã phân bổ vào hóa đơn"
          tone={outstanding > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Tỷ lệ thu"
          value={`${(collectionRate * 100).toFixed(1).replace(".", ",")}%`}
          hint="Theo hóa đơn trong phạm vi báo cáo"
        />
      </div>

      <div className={styles.stats}>
        <StatCard
          label="Đã đối soát"
          value={String(reconciledCount)}
          hint="Giao dịch trong khoảng ngày"
        />
        <StatCard
          label="Chưa đối soát"
          value={String(pendingCount)}
          hint="Giao dịch đang chờ xác nhận"
        />
        <StatCard
          label="Cần kiểm tra"
          value={String(reviewCount)}
          hint="Giao dịch có sai lệch/thông tin chưa rõ"
          tone={reviewCount ? "warning" : "default"}
        />
      </div>

      <Card title="Doanh thu theo tháng (triệu đồng)">
        {monthlyRows.length ? (
          <BarChart
            points={monthlyRows.map(([month, amount]) => ({
              label: month.slice(5),
              value: Math.round(amount / 100_000) / 10,
            }))}
            highlightLast
            ariaLabel={`Doanh thu theo tháng: ${monthlyRows.map(([month, amount]) => `${month}: ${formatVND(amount)}`).join("; ")}`}
          />
        ) : (
          <p className={styles.empty}>
            Không có giao dịch trong khoảng thời gian này.
          </p>
        )}
      </Card>

      <div className={styles.twoColumns}>
        <Card title="Thu học phí theo lớp">
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Lớp</th>
                  <th>Số giao dịch</th>
                  <th>Thực thu</th>
                </tr>
              </thead>
              <tbody>
                {classRows.map((row) => (
                  <tr key={row.className}>
                    <td>
                      <strong>{row.className}</strong>
                    </td>
                    <td>{row.count}</td>
                    <td className={styles.amount}>
                      {formatVND(row.collected)}
                    </td>
                  </tr>
                ))}
                {!classRows.length && (
                  <tr>
                    <td colSpan={3} className={styles.empty}>
                      Chưa có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Thu theo phương thức">
          <div className={styles.methodList}>
            {methodRows.map((row) => {
              const ratio =
                totalCollected > 0 ? (row.amount / totalCollected) * 100 : 0;
              return (
                <div className={styles.methodItem} key={row.method}>
                  <div className={styles.methodHeading}>
                    <strong>{METHOD_LABEL[row.method]}</strong>
                    <strong>{formatVND(row.amount)}</strong>
                  </div>
                  <div className={styles.track}>
                    <span style={{ width: `${ratio}%` }} />
                  </div>
                  <small>
                    {ratio.toFixed(1).replace(".", ",")}% tổng thực thu
                  </small>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card title="Chi tiết thu theo tháng">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tháng nhận tiền</th>
                <th>Số giao dịch</th>
                <th>Thực thu</th>
              </tr>
            </thead>
            <tbody>
              {monthlyRows
                .slice()
                .reverse()
                .map(([month, amount]) => (
                  <tr key={month}>
                    <td>{month}</td>
                    <td>
                      {
                        visibleTransactions.filter((item) =>
                          item.paidAt.startsWith(month),
                        ).length
                      }
                    </td>
                    <td className={styles.amount}>{formatVND(amount)}</td>
                  </tr>
                ))}
              {!monthlyRows.length && (
                <tr>
                  <td colSpan={3} className={styles.empty}>
                    Chưa có dữ liệu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
