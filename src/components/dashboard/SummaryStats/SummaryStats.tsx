import { formatVND } from "@/lib/format";
import type { DashboardSummary } from "@/types/dashboard";
import { StatCard } from "../StatCard";
import styles from "./SummaryStats.module.css";

export function SummaryStats({ summary }: { summary: DashboardSummary }) {
  return (
    <div className={styles.grid}>
      <StatCard
        icon="♙"
        href="/admin/students"
        label="Học sinh đang học"
        value={String(summary.studentCount)}
        hint="Lớp 1 đến lớp 9"
      />
      <StatCard
        icon="▦"
        href="/admin/classes"
        label="Lớp đang mở"
        value={String(summary.classCount)}
        hint={`${summary.classesToday} lớp dạy hôm nay`}
      />
      <StatCard
        icon="↗"
        href="/admin/tuition/revenue"
        label={`Doanh thu ${summary.monthLabel}`}
        value={formatVND(summary.monthRevenue)}
        hint={`Đã thu ${summary.paidInvoices} / ${summary.totalInvoices} hóa đơn`}
        tone="success"
      />
      <StatCard
        icon="₫"
        href="/admin/tuition/debts"
        label="Công nợ"
        value={formatVND(summary.debtAmount)}
        hint={`${summary.debtStudentCount} học sinh chưa đóng`}
        tone="warning"
      />
    </div>
  );
}
