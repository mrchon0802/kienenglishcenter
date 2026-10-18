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
import { StudentReportPicker } from "./_components/StudentReportPicker";
import styles from "./reports.module.css";

export const metadata: Metadata = { title: "Báo cáo | Quản trị" };

async function ReportsContent() {
  await connection();
  const now = new Date();
  const [classes, students] = await Promise.all([getClasses(), getStudents()]);
  const reports = (await Promise.all(classes.map((c) => getClassReport(c.id, now)))).filter(
    (r): r is NonNullable<typeof r> => r !== null,
  );

  return (
    <div className={styles.grid}>
      <Card title="Báo cáo theo lớp">
        <Table>
          <thead>
            <tr>
              <th scope="col">Lớp</th>
              <th scope="col">Sĩ số</th>
              <th scope="col">TB kiểm tra</th>
              <th scope="col">Chuyên cần</th>
              <th scope="col">Công nợ</th>
              <th scope="col">
                <span className="sr-only">Thao tác</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/admin/reports/classes/${r.id}`}>Lớp {r.name}</Link>
                  <div className={styles.note} style={{ margin: 0 }}>
                    {formatSchedule(r.schedule.days, r.schedule.startTime, r.schedule.endTime)}
                  </div>
                </td>
                <td>{r.studentCount}</td>
                <td>{r.testAverage === null ? "-" : formatScore(r.testAverage)}</td>
                <td>{r.attendanceAverage}%</td>
                <td>{r.totalOwed > 0 ? formatVND(r.totalOwed) : "-"}</td>
                <td>
                  <Button href={`/admin/reports/classes/${r.id}`}>Xem</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card title="Báo cáo theo học sinh">
        <StudentReportPicker
          students={students
            .filter((s) => s.status === "active")
            .map((s) => ({ id: s.id, name: s.fullName, className: s.className, code: s.code }))}
        />
      </Card>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <>
      <PageHeader title="Báo cáo" subtitle="Báo cáo điểm số, chuyên cần và học phí của lớp và học sinh · Dữ liệu mẫu" />
      <Suspense fallback={<p>Đang tải báo cáo...</p>}>
        <ReportsContent />
      </Suspense>
    </>
  );
}
