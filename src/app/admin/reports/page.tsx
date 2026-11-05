import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { formatScore, formatVND } from "@/lib/format";
import { formatSchedule } from "@/lib/schedule";
import { getClassReport } from "@/mocks/reports";
import { getClasses } from "@/mocks/classes";
import { getStudents } from "@/mocks/students";
import { getAcademicCenterSummary } from "@/mocks/academic-reports";
import { StudentReportPicker } from "./_components/StudentReportPicker";
import { ReportExport } from "./_components/ReportExport";
import styles from "./reports.module.css";
import academicStyles from "./academic-reports.module.css";

export const metadata: Metadata = { title: "Báo cáo học tập | Quản trị" };

async function ReportsContent() {
  await connection();
  const now = new Date();
  const [classes, students, summary] = await Promise.all([
    getClasses(), getStudents(), getAcademicCenterSummary(now),
  ]);
  const reports = (await Promise.all(classes.map((c) => getClassReport(c.id, now)))).filter(
    (r): r is NonNullable<typeof r> => r !== null,
  );

  return (
    <>
      <section className={academicStyles.overview} aria-label="Tổng quan kết quả học tập">
        <div className={academicStyles.kpis}>
          <article className={academicStyles.kpi}><p className={academicStyles.kpiLabel}>Học viên đang học</p><p className={academicStyles.kpiValue}>{summary.activeStudents}</p><p className={academicStyles.kpiHint}>Trên toàn trung tâm</p></article>
          <article className={academicStyles.kpi}><p className={academicStyles.kpiLabel}>Lớp đang hoạt động</p><p className={academicStyles.kpiValue}>{summary.activeClasses}</p><p className={academicStyles.kpiHint}>Theo danh sách lớp hiện tại</p></article>
          <article className={academicStyles.kpi}><p className={academicStyles.kpiLabel}>Điểm TB kiểm tra</p><p className={academicStyles.kpiValue}>{summary.averageScore === null ? "—" : formatScore(summary.averageScore)}</p><p className={academicStyles.kpiHint}>Chỉ tính học viên đã có điểm</p></article>
          <article className={academicStyles.kpi}><p className={academicStyles.kpiLabel}>Chuyên cần trung bình</p><p className={academicStyles.kpiValue}>{summary.attendanceRate}%</p><p className={academicStyles.kpiHint}>Theo tỷ lệ chuyên cần đang lưu</p></article>
          <article className={academicStyles.kpi}><p className={academicStyles.kpiLabel}>Hoàn thành bài tập</p><p className={academicStyles.kpiValue}>{summary.assignmentCompletionRate}%</p><p className={academicStyles.kpiHint}>Tỷ lệ lượt nộp trên lượt được giao</p></article>
          <article className={academicStyles.kpi}><p className={academicStyles.kpiLabel}>Học viên cần theo dõi</p><p className={academicStyles.kpiValue}>{summary.atRiskCount}</p><p className={academicStyles.kpiHint}>Có ít nhất một dấu hiệu cảnh báo</p></article>
        </div>
        <div className={`${academicStyles.sectionHead} ${academicStyles.noPrint}`}>
          <span className={academicStyles.kpiHint}>Báo cáo tổng hợp theo dữ liệu hiện có</span>
          <ReportExport rows={summary.exportRows} />
        </div>
      </section>

      <div className={academicStyles.overview}>
        <Card title="Học viên cần theo dõi">
          {summary.risks.length ? (
            <div className={academicStyles.riskList}>
              {summary.risks.map((risk) => (
                <article className={academicStyles.riskItem} key={risk.studentId}>
                  <div className={academicStyles.riskName}>
                    <Link href={`/admin/reports/students/${risk.studentId}`}>{risk.studentName}</Link>
                    <span>Lớp {risk.className}</span>
                  </div>
                  <div className={academicStyles.reasonList}>
                    {risk.reasons.map((reason) => <span className={academicStyles.reason} key={reason}>{reason}</span>)}
                  </div>
                  <span className={academicStyles.riskMeta}>
                    {risk.scoreAverage === null ? "Chưa có điểm" : `TB ${formatScore(risk.scoreAverage)}`} · {risk.attendanceRate}% chuyên cần
                    {risk.overdueAmount > 0 ? ` · ${formatVND(risk.overdueAmount)} quá hạn` : ""}
                  </span>
                </article>
              ))}
            </div>
          ) : <p className={academicStyles.empty}>Chưa có học viên nào đạt ngưỡng cảnh báo theo các tiêu chí hiện tại.</p>}
          <p className={academicStyles.empty}>Ngưỡng cảnh báo: chuyên cần dưới 75%, điểm kiểm tra trung bình dưới 5, có học phí quá hạn hoặc bỏ lỡ ít nhất 2 bài kiểm tra/bài tập. Đây là tín hiệu hỗ trợ rà soát, không phải kết luận học lực.</p>
        </Card>
      </div>

      <div className={styles.grid}>
        <Card title="Báo cáo theo lớp">
          <Table>
            <thead><tr><th scope="col">Lớp</th><th scope="col">Sĩ số</th><th scope="col">TB kiểm tra</th><th scope="col">Chuyên cần</th><th scope="col">Công nợ</th><th scope="col"><span className="sr-only">Thao tác</span></th></tr></thead>
            <tbody>
              {reports.map((r) => <tr key={r.id}>
                <td><Link href={`/admin/reports/classes/${r.id}`}>Lớp {r.name}</Link><div className={styles.note} style={{ margin: 0 }}>{formatSchedule(r.schedule.days, r.schedule.startTime, r.schedule.endTime)}</div></td>
                <td>{r.studentCount}</td><td>{r.testAverage === null ? "-" : formatScore(r.testAverage)}</td><td>{r.attendanceAverage}%</td><td>{r.totalOwed > 0 ? formatVND(r.totalOwed) : "-"}</td>
                <td><Button href={`/admin/reports/classes/${r.id}`}>Xem</Button></td>
              </tr>)}
            </tbody>
          </Table>
        </Card>
        <Card title="Báo cáo theo học sinh">
          <StudentReportPicker students={students.filter((s) => s.status === "active").map((s) => ({ id: s.id, name: s.fullName, className: s.className, code: s.code }))} />
        </Card>
      </div>
    </>
  );
}

export default function ReportsPage() {
  return <><PageHeader title="Báo cáo học tập" subtitle="Tổng quan trung tâm, báo cáo lớp, hồ sơ học tập và cảnh báo sớm · Dữ liệu mock hiện tại" /><Suspense fallback={<p>Đang tổng hợp báo cáo...</p>}><ReportsContent /></Suspense></>;
}
