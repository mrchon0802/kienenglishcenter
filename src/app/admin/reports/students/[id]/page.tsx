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
import { formatScore, formatVND } from "@/lib/format";
import { formatDate } from "@/lib/format-date";
import { monthLabel } from "@/lib/month";
import { formatSessionDate } from "@/lib/schedule";
import { STATUS_LABEL } from "@/lib/tuition";
import { getStudentReport } from "@/mocks/reports";
import styles from "../../reports.module.css";

export const metadata: Metadata = { title: "Báo cáo học sinh | Quản trị" };

const ATTENDANCE_LABEL = { present: "Có mặt", absent: "Vắng", excused: "Có phép" } as const;

function shortDate(dueAt: string): string {
  const [, month, day] = dueAt.split("T")[0].split("-");
  return `${day}/${month}`;
}

async function StudentReportContent({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const report = await getStudentReport(id, new Date());
  if (!report) notFound();

  const chartPoints = report.scores.map((s) => ({
    label: `${s.kind === "test" ? "KT" : "LT"} ${shortDate(s.dueAt)}`,
    value: s.score,
  }));
  const chartSummary = report.scores.map((s) => `${s.title}: ${formatScore(s.score)}`).join("; ");

  let compare = "";
  if (report.testAverage !== null && report.classTestAverage !== null) {
    const diff = Math.round((report.testAverage - report.classTestAverage) * 10) / 10;
    compare =
      diff === 0
        ? `Điểm trung bình kiểm tra bằng trung bình cả lớp (${formatScore(report.classTestAverage)}).`
        : `Điểm trung bình kiểm tra ${diff > 0 ? "cao hơn" : "thấp hơn"} trung bình cả lớp (${formatScore(report.classTestAverage)}) ${formatScore(Math.abs(diff))} điểm.`;
  }

  return (
    <>
      <PageHeader
        title={`Báo cáo: ${report.fullName}`}
        subtitle={`Mã ${report.code} · Lớp ${report.className}`}
        actions={
          <>
            <Button href={`/admin/students/${report.studentId}`}>Hồ sơ</Button>
            <Button href={`/admin/reports/classes/${report.classId}`}>Báo cáo lớp</Button>
          </>
        }
      />

      <div className={styles.stats}>
        <StatCard label="Điểm TB bài kiểm tra" value={report.testAverage === null ? "Chưa có" : formatScore(report.testAverage)} hint={report.classTestAverage === null ? "Cả lớp chưa có điểm" : `Cả lớp: ${formatScore(report.classTestAverage)}`} />
        <StatCard label="Chuyên cần" value={`${report.attendanceRate}%`} hint="Tính từ đầu khóa" />
        <StatCard label="Công nợ" value={report.totalOwed > 0 ? formatVND(report.totalOwed) : "Không có"} hint="Học phí chưa đóng đủ" tone={report.totalOwed > 0 ? "warning" : "default"} />
      </div>

      <div className={styles.grid}>
        <Card title="Điểm các bài gần nhất">
          {chartPoints.length === 0 ? (
            <EmptyState title="Chưa có điểm nào" description="Điểm sẽ hiện sau khi học sinh nộp bài." />
          ) : (
            <>
              {compare ? <p className={styles.compare}>{compare}</p> : null}
              <BarChart points={chartPoints} highlightLast ariaLabel={`Điểm các bài gần nhất. ${chartSummary}`} />
              <p className={styles.note}>KT: bài kiểm tra, LT: bài luyện tập (điểm cao nhất). Bài có câu tự luận chưa chấm là điểm tạm tính.</p>
            </>
          )}
        </Card>

        <Card title="Chuyên cần 6 buổi gần nhất">
          <Table>
            <thead>
              <tr>
                <th scope="col">Ngày</th>
                <th scope="col">Nội dung</th>
                <th scope="col">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {report.attendance.map((a) => (
                <tr key={a.sessionId}>
                  <td>{formatSessionDate(a.date)}</td>
                  <td>{a.topic}</td>
                  <td>
                    {a.status === null ? (
                      <Badge tone="amber">Chưa điểm danh</Badge>
                    ) : (
                      <Badge tone={a.status === "present" ? "teal" : "amber"}>{ATTENDANCE_LABEL[a.status]}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>

      <Card title="Học phí 6 tháng gần nhất">
        {report.invoices.length === 0 ? (
          <EmptyState title="Chưa có hóa đơn nào" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th scope="col">Tháng</th>
                <th scope="col">Học phí</th>
                <th scope="col">Đã đóng</th>
                <th scope="col">Còn lại</th>
                <th scope="col">Hạn đóng</th>
                <th scope="col">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {report.invoices.map((v) => (
                <tr key={v.id}>
                  <td>
                    <Link href={`/admin/tuition/invoices/${v.id}`}>{monthLabel(v.month)}</Link>
                  </td>
                  <td>{formatVND(v.amount)}</td>
                  <td>{formatVND(v.paid)}</td>
                  <td>{v.remaining > 0 ? <strong>{formatVND(v.remaining)}</strong> : "-"}</td>
                  <td>{formatDate(v.dueDate)}</td>
                  <td>
                    <Badge tone={v.status === "paid" ? "teal" : "amber"}>{STATUS_LABEL[v.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card title="Thông tin liên hệ">
        <dl className={styles.info}>
          <div><dt>Phụ huynh</dt><dd>{report.parentName}</dd></div>
          <div><dt>Số điện thoại</dt><dd>{report.parentPhone}</dd></div>
          <div><dt>Ngày nhập học</dt><dd>{formatDate(report.enrolledDate)}</dd></div>
        </dl>
      </Card>
    </>
  );
}

export default function StudentReportPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Đang tải báo cáo học sinh...</p>}>
      <StudentReportContent params={params} />
    </Suspense>
  );
}
