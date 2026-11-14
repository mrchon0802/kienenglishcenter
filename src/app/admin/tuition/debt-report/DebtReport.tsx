"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatVND } from "@/lib/format";
import type { InvoiceView } from "@/types/tuition";
import styles from "./DebtReport.module.css";

type Bucket = "not_due" | "1_30" | "31_60" | "over_60";
type InvoiceRow = InvoiceView & { overdueDays: number; bucket: Bucket };

interface Props {
  today: string;
  invoices: InvoiceView[];
}

function dayNumber(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 86400000);
}

function getBucket(days: number): Bucket {
  if (days <= 0) return "not_due";
  if (days <= 30) return "1_30";
  if (days <= 60) return "31_60";
  return "over_60";
}

const BUCKET_LABEL: Record<Bucket, string> = {
  not_due: "Chưa đến hạn",
  "1_30": "Quá hạn 1–30 ngày",
  "31_60": "Quá hạn 31–60 ngày",
  over_60: "Quá hạn trên 60 ngày",
};

export function DebtReport({ today, invoices }: Props) {
  const [keyword, setKeyword] = useState("");
  const [className, setClassName] = useState("all");
  const [bucket, setBucket] = useState<"all" | Bucket>("all");
  const [month, setMonth] = useState("all");

  const debtRows = useMemo<InvoiceRow[]>(() => {
    return invoices
      .filter((invoice) => invoice.remaining > 0)
      .map((invoice) => {
        const overdueDays = Math.max(0, dayNumber(today) - dayNumber(invoice.dueDate));
        return { ...invoice, overdueDays, bucket: getBucket(overdueDays) };
      });
  }, [invoices, today]);

  const classes = useMemo(
    () => [...new Set(debtRows.map((row) => row.className))].sort((a, b) =>
      a.localeCompare(b, "vi", { numeric: true, sensitivity: "base" }),
    ),
    [debtRows],
  );

  const months = useMemo(
    () => [...new Set(debtRows.map((row) => row.month))].sort((a, b) => b.localeCompare(a)),
    [debtRows],
  );

  const filtered = useMemo(() => {
    const q = keyword.trim().toLocaleLowerCase("vi");
    return debtRows
      .filter((row) => {
        const text = [
          row.studentName,
          row.studentId,
          row.className,
          row.id,
          row.month,
        ].join(" ").toLocaleLowerCase("vi");
        return (
          (!q || text.includes(q)) &&
          (className === "all" || row.className === className) &&
          (bucket === "all" || row.bucket === bucket) &&
          (month === "all" || row.month === month)
        );
      })
      .sort((a, b) =>
        b.overdueDays - a.overdueDays ||
        b.remaining - a.remaining ||
        a.studentName.localeCompare(b.studentName, "vi"),
      );
  }, [debtRows, keyword, className, bucket, month]);

  const totalDebt = filtered.reduce((sum, row) => sum + row.remaining, 0);
  const overdueDebt = filtered
    .filter((row) => row.overdueDays > 0)
    .reduce((sum, row) => sum + row.remaining, 0);
  const overdueStudents = new Set(
    filtered.filter((row) => row.overdueDays > 0).map((row) => row.studentId),
  ).size;
  const studentCount = new Set(filtered.map((row) => row.studentId)).size;

  const bucketRows = (["not_due", "1_30", "31_60", "over_60"] as Bucket[]).map((key) => {
    const rows = filtered.filter((row) => row.bucket === key);
    return {
      key,
      label: BUCKET_LABEL[key],
      amount: rows.reduce((sum, row) => sum + row.remaining, 0),
      invoiceCount: rows.length,
      studentCount: new Set(rows.map((row) => row.studentId)).size,
    };
  });

  const classRows = useMemo(() => {
    const map = new Map<string, { amount: number; students: Set<string>; invoices: number }>();
    for (const row of filtered) {
      const item = map.get(row.className) ?? {
        amount: 0,
        students: new Set<string>(),
        invoices: 0,
      };
      item.amount += row.remaining;
      item.students.add(row.studentId);
      item.invoices += 1;
      map.set(row.className, item);
    }
    return [...map.entries()]
      .map(([name, value]) => ({
        name,
        amount: value.amount,
        students: value.students.size,
        invoices: value.invoices,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi", { numeric: true }));
  }, [filtered]);

  function exportCSV() {
    const headers = [
      "Học sinh", "Mã học sinh", "Lớp", "Tháng hóa đơn",
      "Mã hóa đơn", "Ngày đến hạn", "Số ngày quá hạn",
      "Nhóm công nợ", "Học phí", "Đã thanh toán", "Còn nợ",
    ];
    const quote = (value: string | number) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = filtered.map((row) => [
      row.studentName,
      row.studentId,
      row.className,
      row.month,
      row.id,
      row.dueDate,
      row.overdueDays,
      BUCKET_LABEL[row.bucket],
      row.amount,
      row.paid,
      row.remaining,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(quote).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bao-cao-cong-no-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.container}>
      <div className={styles.stats}>
        <StatCard label="Tổng công nợ" value={formatVND(totalDebt)} hint={`${filtered.length} hóa đơn còn dư nợ`} tone={totalDebt > 0 ? "warning" : "default"} />
        <StatCard label="Học sinh còn nợ" value={String(studentCount)} hint="Theo bộ lọc hiện tại" />
        <StatCard label="Nợ quá hạn" value={formatVND(overdueDebt)} hint={`${overdueStudents} học sinh có hóa đơn quá hạn`} tone={overdueDebt > 0 ? "warning" : "default"} />
        <StatCard label="Hóa đơn quá hạn" value={String(filtered.filter((row) => row.overdueDays > 0).length)} hint="Đã qua ngày đến hạn" />
      </div>

      <Card title="Phạm vi báo cáo">
        <div className={styles.filters}>
          <label>
            <span>Tìm kiếm</span>
            <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tên, mã học sinh, lớp, mã hóa đơn..." />
          </label>
          <label>
            <span>Lớp</span>
            <select value={className} onChange={(event) => setClassName(event.target.value)}>
              <option value="all">Tất cả lớp</option>
              {classes.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <label>
            <span>Tháng hóa đơn</span>
            <select value={month} onChange={(event) => setMonth(event.target.value)}>
              <option value="all">Tất cả tháng</option>
              {months.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label>
            <span>Mức độ công nợ</span>
            <select value={bucket} onChange={(event) => setBucket(event.target.value as "all" | Bucket)}>
              <option value="all">Tất cả mức độ</option>
              {(Object.keys(BUCKET_LABEL) as Bucket[]).map((key) => <option key={key} value={key}>{BUCKET_LABEL[key]}</option>)}
            </select>
          </label>
          <div className={styles.actions}>
            <button type="button" className={styles.secondaryButton} onClick={() => {
              setKeyword(""); setClassName("all"); setMonth("all"); setBucket("all");
            }}>Xóa bộ lọc</button>
            <button type="button" className={styles.exportButton} onClick={exportCSV} disabled={!filtered.length}>Xuất CSV</button>
            <button type="button" className={styles.secondaryButton} onClick={() => window.print()}>In báo cáo</button>
          </div>
        </div>
      </Card>

      <Card title="Phân loại theo thời gian quá hạn">
        <div className={styles.bucketGrid}>
          {bucketRows.map((row) => (
            <button
              type="button"
              key={row.key}
              className={`${styles.bucketCard} ${bucket === row.key ? styles.bucketActive : ""}`}
              onClick={() => setBucket(bucket === row.key ? "all" : row.key)}
            >
              <span>{row.label}</span>
              <strong>{formatVND(row.amount)}</strong>
              <small>{row.invoiceCount} hóa đơn · {row.studentCount} học sinh</small>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Công nợ theo lớp">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Lớp</th><th>Học sinh còn nợ</th><th>Hóa đơn</th><th>Tổng công nợ</th></tr></thead>
            <tbody>
              {classRows.map((row) => (
                <tr key={row.name}>
                  <td><strong>{row.name}</strong></td>
                  <td>{row.students}</td>
                  <td>{row.invoices}</td>
                  <td className={styles.amount}>{formatVND(row.amount)}</td>
                </tr>
              ))}
              {!classRows.length && <tr><td colSpan={4} className={styles.empty}>Không có dữ liệu công nợ.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className={styles.mobileClassCards}>
          {classRows.map((row) => (
            <article className={styles.mobileClassCard} key={`mobile-${row.name}`}>
              <strong>Lớp {row.name}</strong>
              <div><span>Học sinh còn nợ</span><b>{row.students}</b></div>
              <div><span>Số hóa đơn</span><b>{row.invoices}</b></div>
              <div className={styles.mobileTotal}><span>Tổng công nợ</span><b>{formatVND(row.amount)}</b></div>
            </article>
          ))}
          {!classRows.length && <p className={styles.empty}>Không có dữ liệu công nợ.</p>}
        </div>
      </Card>

      <Card title="Chi tiết hóa đơn còn công nợ">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Học sinh</th><th>Lớp</th><th>Tháng</th><th>Đến hạn</th>
                <th>Quá hạn</th><th>Học phí</th><th>Đã thu</th><th>Còn nợ</th><th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.studentName}</strong><small className={styles.subText}>{row.studentId}</small></td>
                  <td>{row.className}</td>
                  <td>{row.month}</td>
                  <td>{row.dueDate}</td>
                  <td>
                    <span className={`${styles.ageBadge} ${row.overdueDays > 60 ? styles.critical : row.overdueDays > 0 ? styles.overdue : styles.notDue}`}>
                      {row.overdueDays > 0 ? `${row.overdueDays} ngày` : "Chưa quá hạn"}
                    </span>
                  </td>
                  <td>{formatVND(row.amount)}</td>
                  <td>{formatVND(row.paid)}</td>
                  <td className={styles.amount}>{formatVND(row.remaining)}</td>
                  <td><Link className={styles.detailLink} href={`/admin/tuition/invoices/${row.id}`}>Xem hóa đơn</Link></td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={9} className={styles.empty}>Không tìm thấy hóa đơn còn công nợ.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className={styles.mobileInvoiceCards}>
          {filtered.map((row) => (
            <article className={styles.mobileInvoiceCard} key={`mobile-${row.id}`}>
              <div className={styles.mobileInvoiceHead}>
                <div><strong>{row.studentName}</strong><small>{row.studentId} · Lớp {row.className}</small></div>
                <span className={`${styles.ageBadge} ${row.overdueDays > 60 ? styles.critical : row.overdueDays > 0 ? styles.overdue : styles.notDue}`}>
                  {row.overdueDays > 0 ? `${row.overdueDays} ngày` : "Chưa quá hạn"}
                </span>
              </div>
              <div className={styles.mobileInvoiceMeta}>
                <span>Kỳ {row.month}</span><span>Hạn {row.dueDate}</span>
              </div>
              <div className={styles.mobileInvoiceAmounts}>
                <div><span>Học phí</span><b>{formatVND(row.amount)}</b></div>
                <div><span>Đã thu</span><b>{formatVND(row.paid)}</b></div>
                <div><span>Còn nợ</span><b>{formatVND(row.remaining)}</b></div>
              </div>
              <Link className={styles.detailLink} href={`/admin/tuition/invoices/${row.id}`}>Xem hóa đơn</Link>
            </article>
          ))}
          {!filtered.length && <p className={styles.empty}>Không tìm thấy hóa đơn còn công nợ.</p>}
        </div>
        <p className={styles.note}>Công nợ được lấy trực tiếp từ số dư còn lại của từng hóa đơn sau khi trừ các khoản đã thanh toán. Một học sinh có thể xuất hiện ở nhiều hóa đơn.</p>
      </Card>
    </div>
  );
}
