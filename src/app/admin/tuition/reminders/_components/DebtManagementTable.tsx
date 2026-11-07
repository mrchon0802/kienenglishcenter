"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { InvoiceView } from "@/types/tuition";
import { formatVND } from "@/lib/format";
import { monthLabel } from "@/lib/month";
import styles from "./DebtManagementTable.module.css";

type DebtLevel = "all" | "normal" | "warning" | "critical";
type SortMode = "oldest" | "highest" | "student";

interface Props {
  invoices: InvoiceView[];
  today: string;
  warningDays: number;
  criticalDays: number;
}

function overdueDays(dueDate: string, today: string): number {
  const due = new Date(`${dueDate}T00:00:00Z`).getTime();
  const now = new Date(`${today}T00:00:00Z`).getTime();
  return Math.max(0, Math.floor((now - due) / 86_400_000));
}

function csvCell(value: string | number): string {
  const text = String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function DebtManagementTable({
  invoices,
  today,
  warningDays,
  criticalDays,
}: Props) {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState<DebtLevel>("all");
  const [sort, setSort] = useState<SortMode>("oldest");

  const enriched = useMemo(
    () =>
      invoices.map((invoice) => {
        const days = overdueDays(invoice.dueDate, today);
        const level: Exclude<DebtLevel, "all"> =
          days >= criticalDays
            ? "critical"
            : days >= warningDays
              ? "warning"
              : "normal";
        return { ...invoice, overdueDays: days, debtLevel: level };
      }),
    [invoices, today, warningDays, criticalDays],
  );

  const classes = useMemo(
    () => [...new Set(invoices.map((item) => item.className))].sort((a, b) => a.localeCompare(b, "vi")),
    [invoices],
  );
  const months = useMemo(
    () => [...new Set(invoices.map((item) => item.month))].sort().reverse(),
    [invoices],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");
    const rows = enriched.filter((item) => {
      const matchesSearch =
        !query ||
        item.studentName.toLocaleLowerCase("vi").includes(query) ||
        item.studentId.toLocaleLowerCase("vi").includes(query) ||
        item.id.toLocaleLowerCase("vi").includes(query);
      return (
        matchesSearch &&
        (classFilter === "all" || item.className === classFilter) &&
        (monthFilter === "all" || item.month === monthFilter) &&
        (statusFilter === "all" || item.status === statusFilter) &&
        (levelFilter === "all" || item.debtLevel === levelFilter)
      );
    });

    return rows.sort((a, b) => {
      if (sort === "highest") return b.remaining - a.remaining;
      if (sort === "student") return a.studentName.localeCompare(b.studentName, "vi");
      return b.overdueDays - a.overdueDays || a.dueDate.localeCompare(b.dueDate);
    });
  }, [enriched, search, classFilter, monthFilter, statusFilter, levelFilter, sort]);

  const totalDebt = invoices.reduce((sum, item) => sum + item.remaining, 0);
  const overdueInvoices = enriched.filter((item) => item.overdueDays > 0);
  const warningCount = enriched.filter((item) => item.debtLevel === "warning").length;
  const criticalCount = enriched.filter((item) => item.debtLevel === "critical").length;
  const overdueStudents = new Set(overdueInvoices.map((item) => item.studentId)).size;

  function exportCsv() {
    const header = [
      "Mã hóa đơn",
      "Học sinh",
      "Mã học sinh",
      "Lớp",
      "Kỳ học",
      "Hạn đóng",
      "Tổng học phí",
      "Đã thanh toán",
      "Còn nợ",
      "Số ngày quá hạn",
      "Mức công nợ",
      "Trạng thái",
    ];
    const rows = filtered.map((item) => [
      item.id,
      item.studentName,
      item.studentId,
      item.className,
      monthLabel(item.month),
      item.dueDate,
      item.amount,
      item.paid,
      item.remaining,
      item.overdueDays,
      item.debtLevel === "critical" ? "Nghiêm trọng" : item.debtLevel === "warning" ? "Kéo dài" : "Thông thường",
      item.status === "overdue" ? "Quá hạn" : item.status === "partial" ? "Đã đóng một phần" : "Chưa đến hạn",
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `cong-no-hoc-phi-${today}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className={styles.section} aria-label="Thống kê và lọc công nợ">
      <div className={styles.metrics}>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Tổng công nợ</span>
          <strong className={styles.metricValue}>{formatVND(totalDebt)}</strong>
          <span className={styles.metricHint}>{invoices.length} hóa đơn chưa thanh toán đủ</span>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Học sinh quá hạn</span>
          <strong className={styles.metricValue}>{overdueStudents}</strong>
          <span className={styles.metricHint}>{overdueInvoices.length} hóa đơn đã quá hạn</span>
        </article>
        <article className={`${styles.metricCard} ${styles.warningMetric}`}>
          <span className={styles.metricLabel}>Nợ kéo dài</span>
          <strong className={styles.metricValue}>{warningCount}</strong>
          <span className={styles.metricHint}>Từ {warningDays} đến {criticalDays - 1} ngày</span>
        </article>
        <article className={`${styles.metricCard} ${styles.criticalMetric}`}>
          <span className={styles.metricLabel}>Nợ nghiêm trọng</span>
          <strong className={styles.metricValue}>{criticalCount}</strong>
          <span className={styles.metricHint}>Từ {criticalDays} ngày trở lên</span>
        </article>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.heading}>
          <div>
            <h2 className={styles.title}>Các hóa đơn còn nợ</h2>
            <p className={styles.description}>Tìm kiếm, lọc và xuất danh sách công nợ theo điều kiện đang chọn.</p>
          </div>
          <span className={styles.count}>{filtered.length}/{invoices.length} hóa đơn</span>
        </div>

        <div className={styles.filters}>
          <label className={styles.searchField}>
            <span>Tìm học sinh / mã hóa đơn</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nhập tên hoặc mã..." />
          </label>
          <label>
            <span>Lớp</span>
            <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
              <option value="all">Tất cả lớp</option>
              {classes.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <label>
            <span>Kỳ học</span>
            <select value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)}>
              <option value="all">Tất cả kỳ</option>
              {months.map((month) => <option key={month} value={month}>{monthLabel(month)}</option>)}
            </select>
          </label>
          <label>
            <span>Trạng thái</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="unpaid">Chưa thanh toán</option>
              <option value="partial">Đã đóng một phần</option>
              <option value="overdue">Quá hạn</option>
            </select>
          </label>
          <label>
            <span>Mức công nợ</span>
            <select
              value={levelFilter}
              onChange={(event) => {
                const value = event.target.value;
                if (value === "all" || value === "normal" || value === "warning" || value === "critical") {
                  setLevelFilter(value);
                }
              }}
            >
              <option value="all">Tất cả mức</option>
              <option value="normal">Thông thường</option>
              <option value="warning">Nợ kéo dài</option>
              <option value="critical">Nợ nghiêm trọng</option>
            </select>
          </label>
          <label>
            <span>Sắp xếp</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
              <option value="oldest">Quá hạn lâu nhất</option>
              <option value="highest">Số tiền nợ cao nhất</option>
              <option value="student">Tên học sinh A–Z</option>
            </select>
          </label>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.resetButton} onClick={() => {
            setSearch("");
            setClassFilter("all");
            setMonthFilter("all");
            setStatusFilter("all");
            setLevelFilter("all");
            setSort("oldest");
          }}>
            Xóa bộ lọc
          </button>
          <button type="button" className={styles.exportButton} onClick={exportCsv} disabled={!filtered.length}>
            Xuất CSV ({filtered.length})
          </button>
        </div>
      </div>

      {filtered.length ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Học sinh</th><th>Lớp</th><th>Kỳ học</th><th>Hạn đóng</th>
                <th className={styles.alignRight}>Còn nợ</th><th>Quá hạn</th><th>Mức nợ</th><th>Trạng thái</th><th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td><Link href={`/admin/tuition/students/${item.studentId}`} className={styles.studentProfileLink}><strong className={styles.studentName}>{item.studentName}</strong></Link><small className={styles.studentId}>{item.studentId}</small></td>
                  <td><span className={styles.classTag}>{item.className}</span></td>
                  <td>{monthLabel(item.month)}</td>
                  <td>{item.dueDate}</td>
                  <td className={`${styles.alignRight} ${styles.amount}`}>{formatVND(item.remaining)}</td>
                  <td>{item.overdueDays > 0 ? `${item.overdueDays} ngày` : "—"}</td>
                  <td>
                    <span className={`${styles.levelBadge} ${item.debtLevel === "critical" ? styles.critical : item.debtLevel === "warning" ? styles.warning : styles.normal}`}>
                      {item.debtLevel === "critical" ? "Nghiêm trọng" : item.debtLevel === "warning" ? "Kéo dài" : "Thông thường"}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${item.status === "overdue" ? styles.overdue : item.status === "partial" ? styles.partial : styles.pending}`}>
                      {item.status === "overdue" ? "Quá hạn" : item.status === "partial" ? "Đóng một phần" : "Chưa đến hạn"}
                    </span>
                  </td>
                  <td><Link href={`/admin/tuition/invoices/${item.id}`} className={styles.detailLink}>Chi tiết →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyState}>Không tìm thấy hóa đơn phù hợp với bộ lọc.</div>
      )}
      <p className={styles.footnote}>Mức công nợ được tính theo số ngày quá hạn của từng hóa đơn và ngưỡng cảnh báo trong cấu hình nhắc học phí.</p>
    </section>
  );
}
