import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { BarChart } from "@/components/dashboard/BarChart";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table } from "@/components/ui/Table";
import { LOW_SCORE_THRESHOLD } from "@/lib/constants";
import { formatScore, formatVND } from "@/lib/format";
import { formatDateTime } from "@/lib/format-datetime";
import { formatSchedule } from "@/lib/schedule";
import { getClassReport } from "@/mocks/reports";
import styles from "../../reports.module.css";

export const metadata: Metadata = { title: "Báo cáo lớp | Quản trị" };

async function ClassReportContent({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const report = await getClassReport(id, new Date());
  if (!report) notFound();

  const chartSummary = report.distribution.map((d) => `${d.label}: ${d.count} học sinh`).join("; ");

  return (
    <>
      <PageHeader
        title={`Báo cáo lớp ${report.name}`}
        subtitle={`${formatSchedule(report.schedule.days, report.schedule.startTime, report.schedule.endTime)} · Đang học Unit ${report.currentUnit}`}
        actions={
          <>
            <Button href={`/admin/classes/${report.id}`}>Chi tiết lớp</Button>
            <Button href="/admin/reports">Về báo cáo</Button>
          </>
        }
      />

      <div className={styles.stats}>
        <StatCard label="Sĩ số" value={String(report.studentCount)} hint="Học sinh đang học" />
        <StatCard label="Điểm TB bài kiểm tra" value={report.testAverage === null ? "Chưa có" : formatScore(report.testAverage)} hint={`${report.noScoreCount} học sinh chưa có điểm`} />
        <StatCard label="Chuyên cần trung bình" value={`${report.attendanceAverage}%`} hint="Tính từ đầu khóa" />
        <StatCard label="Công nợ của lớp" value={report.totalOwed > 0 ? formatVND(report.totalOwed) : "Không có"} hint="Học phí chưa đóng đủ" tone={report.totalOwed > 0 ? "warning" : "default"} />
      </div>

      <div className={styles.grid}>
        <Card title="Phân bố điểm trung bình kiểm tra">
          <BarChart
            points={report.distribution.map((d) => ({ label: d.label, value: d.count }))}
            ariaLabel={`Số học sinh theo mức điểm. ${chartSummary}`}
          />
          <p className={styles.note}>Số học sinh ở mỗi mức điểm trung bình các bài kiểm tra đã nộp.</p>
        </Card>

        <Card title="Bài tập của lớp">
          {report.assignments.length === 0 ? (
            <EmptyState title="Lớp chưa có bài tập nào" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <th scope="col">Bài</th>
                  <th scope="col">Loại</th>
                  <th scope="col">Hạn nộp</th>
                  <th scope="col">Đã nộp</th>
                  <th scope="col">Điểm TB</th>
                </tr>
              </thead>
              <tbody>
                {report.assignments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link href={`/admin/assignments/${a.id}`}>{a.title}</Link>
                    </td>
                    <td>
                      <Badge tone={a.kind === "test" ? "amber" : "teal"}>{a.kind === "test" ? "Kiểm tra" : "Luyện tập"}</Badge>
                    </td>
                    <td>{formatDateTime(a.dueAt)}</td>
                    <td>
                      {a.submitted} / {a.total}
                    </td>
                    <td>{a.averageScore === null ? "-" : formatScore(a.averageScore)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>

      <Card title="Từng học sinh">
        <Table>
          <thead>
            <tr>
              <th scope="col">Học sinh</th>
              <th scope="col">TB kiểm tra</th>
              <th scope="col">Chuyên cần</th>
              <th scope="col">Công nợ</th>
              <th scope="col">
                <span className="sr-only">Thao tác</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {report.students.map((s) => (
              <tr key={s.studentId}>
                <td>{s.studentName}</td>
                <td>
                  {s.testAverage === null ? (
                    "-"
                  ) : s.testAverage < LOW_SCORE_THRESHOLD ? (
                    <Badge tone="amber">{formatScore(s.testAverage)}</Badge>
                  ) : (
                    <strong>{formatScore(s.testAverage)}</strong>
                  )}
                </td>
                <td>{s.attendanceRate}%</td>
                <td>
                  {s.owed > 0 ? (
                    <>
                      {formatVND(s.owed)} {s.hasOverdue ? <Badge tone="amber">Quá hạn</Badge> : null}
                    </>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  <Button href={`/admin/reports/students/${s.studentId}`}>Báo cáo</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p className={styles.note}>
          Xếp theo điểm trung bình kiểm tra từ cao xuống thấp. Màu cam là dưới {formatScore(LOW_SCORE_THRESHOLD)}.
        </p>
      </Card>
    </>
  );
}

export default function ClassReportPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Đang tải báo cáo lớp...</p>}>
      <ClassReportContent params={params} />
    </Suspense>
  );
}
