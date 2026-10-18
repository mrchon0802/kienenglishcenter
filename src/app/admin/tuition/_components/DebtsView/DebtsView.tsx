"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import { formatVND } from "@/lib/format";
import { monthLabel } from "@/lib/month";
import type { DebtorRow } from "@/types/tuition";
import styles from "./DebtsView.module.css";

export function DebtsView({ debtors }: { debtors: DebtorRow[] }) {
  const [className, setClassName] = useState("");

  const classOptions = useMemo(
    () => [...new Set(debtors.map((d) => d.className))].sort().map((c) => ({ value: c, label: `Lớp ${c}` })),
    [debtors],
  );
  const visible = useMemo(
    () => debtors.filter((d) => !className || d.className === className),
    [debtors, className],
  );

  const total = visible.reduce((s, d) => s + d.totalOwed, 0);
  const overdue = visible.reduce((s, d) => s + d.overdueAmount, 0);

  return (
    <>
      <div className={styles.stats}>
        <StatCard label="Tổng công nợ" value={formatVND(total)} hint={`${visible.length} học sinh còn nợ`} tone={total > 0 ? "warning" : "default"} />
        <StatCard label="Trong đó quá hạn" value={formatVND(overdue)} hint="Đã qua hạn đóng ngày 10" tone={overdue > 0 ? "warning" : "default"} />
        <StatCard label="Chưa đến hạn" value={formatVND(total - overdue)} hint="Hóa đơn tháng hiện tại" />
      </div>

      <Card>
        <div className={styles.toolbar}>
          <Select label="Lớp" placeholder="Tất cả lớp" options={classOptions} value={className} onChange={(e) => setClassName(e.target.value)} />
        </div>

        {visible.length === 0 ? (
          <EmptyState title="Không có công nợ" description="Tất cả học sinh đã đóng đủ học phí." />
        ) : (
          <Table>
            <thead>
              <tr>
                <th scope="col">Học sinh</th>
                <th scope="col">Lớp</th>
                <th scope="col">Số tháng nợ</th>
                <th scope="col">Nợ từ</th>
                <th scope="col">Quá hạn</th>
                <th scope="col">Tổng nợ</th>
                <th scope="col">
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((d) => (
                <tr key={d.studentId}>
                  <td>
                    <Link href={`/admin/students/${d.studentId}`}>{d.studentName}</Link>
                  </td>
                  <td>{d.className}</td>
                  <td>{d.invoiceCount}</td>
                  <td>{monthLabel(d.oldestMonth)}</td>
                  <td>{d.overdueAmount > 0 ? formatVND(d.overdueAmount) : "-"}</td>
                  <td>
                    <strong>{formatVND(d.totalOwed)}</strong>
                  </td>
                  <td>
                    <Button href={`/admin/tuition/invoices/${d.oldestInvoiceId}`} variant="primary">
                      Thu tiền
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <p className={styles.hint}>
          Công nợ là tổng số tiền còn lại của các hóa đơn chưa đóng đủ. “Thu tiền” mở hóa đơn cũ nhất của học sinh đó.
        </p>
      </Card>
    </>
  );
}
