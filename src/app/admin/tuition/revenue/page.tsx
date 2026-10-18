import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { BarChart } from "@/components/dashboard/BarChart";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { formatNumber, formatVND } from "@/lib/format";
import { addMonths, monthLabel, monthShort, toISODate } from "@/lib/month";
import { getClassRevenue, getMonthSummaries } from "@/mocks/tuition";

export const metadata: Metadata = { title: "Doanh thu | Quản trị" };

const percent = (rate: number) => `${Math.round(rate * 100)}%`;

async function RevenueContent() {
  await connection();
  const today = toISODate(new Date());
  const current = today.slice(0, 7);
  const months = Array.from({ length: 6 }, (_, i) => addMonths(current, i - 5)); // cũ → mới
  const [summaries, byClass] = await Promise.all([getMonthSummaries(months, today), getClassRevenue(current, today)]);
  const now = summaries[summaries.length - 1];

  const points = summaries.map((s) => ({
    label: monthShort(s.month),
    value: Math.round(s.collected / 100_000) / 10, // triệu đồng, 1 chữ số thập phân
  }));
  const chartSummary = summaries.map((s) => `${monthShort(s.month)}: ${formatNumber(Math.round(s.collected / 100_000) / 10)} triệu`).join("; ");

  return (
    <>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))" }}>
        <StatCard label={`Thực thu ${monthLabel(now.month)}`} value={formatVND(now.collected)} hint="Tiền đã nhận trong tháng" />
        <StatCard label="Phải thu của tháng" value={formatVND(now.invoiced)} hint="Tổng hóa đơn tháng này" />
        <StatCard label="Còn nợ của tháng" value={formatVND(now.outstanding)} hint="Hóa đơn tháng này chưa đóng đủ" tone={now.outstanding > 0 ? "warning" : "default"} />
        <StatCard label="Tỷ lệ đã thu" value={percent(now.collectionRate)} hint="Của hóa đơn tháng này" />
      </div>

      <Card title="Thực thu 6 tháng gần nhất (triệu đồng)">
        <BarChart points={points} highlightLast ariaLabel={`Thực thu theo tháng. ${chartSummary}`} />
      </Card>

      <Card title="Chi tiết theo tháng">
        <Table>
          <thead>
            <tr>
              <th scope="col">Tháng</th>
              <th scope="col">Phải thu (hóa đơn tháng)</th>
              <th scope="col">Thực thu trong tháng</th>
              <th scope="col">Còn nợ của hóa đơn</th>
              <th scope="col">Tỷ lệ đã thu</th>
            </tr>
          </thead>
          <tbody>
            {[...summaries].reverse().map((s) => (
              <tr key={s.month}>
                <td>{monthLabel(s.month)}</td>
                <td>{formatVND(s.invoiced)}</td>
                <td>
                  <strong>{formatVND(s.collected)}</strong>
                </td>
                <td>{s.outstanding > 0 ? formatVND(s.outstanding) : "-"}</td>
                <td>{percent(s.collectionRate)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p style={{ marginTop: 12, fontSize: 13, color: "var(--color-muted)" }}>
          “Thực thu” tính theo ngày nhận tiền (có thể gồm tiền đóng bù cho tháng trước). “Còn nợ” và “Tỷ lệ đã thu” tính theo hóa đơn của từng tháng.
        </p>
      </Card>

      <Card title={`Theo lớp, ${monthLabel(current)}`}>
        <Table>
          <thead>
            <tr>
              <th scope="col">Lớp</th>
              <th scope="col">Phải thu</th>
              <th scope="col">Đã thu</th>
              <th scope="col">Còn nợ</th>
            </tr>
          </thead>
          <tbody>
            {byClass.map((c) => (
              <tr key={c.classId}>
                <td>Lớp {c.className}</td>
                <td>{formatVND(c.invoiced)}</td>
                <td>{formatVND(c.paid)}</td>
                <td>{c.outstanding > 0 ? formatVND(c.outstanding) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}

export default function RevenuePage() {
  return (
    <>
      <PageHeader title="Doanh thu" subtitle="Tiền thực thu và tỷ lệ thu học phí · Dữ liệu mẫu" />
      <Suspense fallback={<p>Đang tải doanh thu...</p>}>
        <RevenueContent />
      </Suspense>
    </>
  );
}
