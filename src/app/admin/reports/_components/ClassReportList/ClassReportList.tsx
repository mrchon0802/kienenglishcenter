import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatScore, formatVND } from "@/lib/format";
import { formatSchedule } from "@/lib/schedule";
import styles from "./ClassReportList.module.css";

interface ClassReportListProps {
  reports: {
    id: string;
    name: string;
    schedule: { days: number[]; startTime: string; endTime: string };
    studentCount: number;
    testAverage: number | null;
    attendanceAverage: number;
    totalOwed: number;
  }[];
}

export function ClassReportList({ reports }: ClassReportListProps) {
  if (reports.length === 0) {
    return <p className={styles.empty}>Chưa có dữ liệu báo cáo lớp.</p>;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.desktopTable}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Lớp</th>
              <th scope="col">Sĩ số</th>
              <th scope="col">TB kiểm tra</th>
              <th scope="col">Chuyên cần</th>
              <th scope="col">Công nợ</th>
              <th scope="col"><span className="sr-only">Thao tác</span></th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>
                  <Link className={styles.className} href={`/admin/reports/classes/${report.id}`}>Lớp {report.name}</Link>
                  <span className={styles.schedule}>{formatSchedule(report.schedule.days, report.schedule.startTime, report.schedule.endTime)}</span>
                </td>
                <td>{report.studentCount}</td>
                <td>{report.testAverage === null ? "—" : formatScore(report.testAverage)}</td>
                <td>{report.attendanceAverage}%</td>
                <td>{report.totalOwed > 0 ? formatVND(report.totalOwed) : "—"}</td>
                <td><Button href={`/admin/reports/classes/${report.id}`} variant="secondary">Xem</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.mobileList}>
        {reports.map((report) => (
          <article className={styles.classCard} key={report.id}>
            <div className={styles.cardHead}>
              <div className={styles.classIdentity}>
                <Link className={styles.className} href={`/admin/reports/classes/${report.id}`}>Lớp {report.name}</Link>
                <span className={styles.schedule}>{formatSchedule(report.schedule.days, report.schedule.startTime, report.schedule.endTime)}</span>
              </div>
              <span className={styles.studentCount}>{report.studentCount} HV</span>
            </div>
            <div className={styles.metrics}>
              <div><span>TB kiểm tra</span><strong>{report.testAverage === null ? "—" : formatScore(report.testAverage)}</strong></div>
              <div><span>Chuyên cần</span><strong>{report.attendanceAverage}%</strong></div>
              <div><span>Công nợ</span><strong className={report.totalOwed > 0 ? styles.owed : ""}>{report.totalOwed > 0 ? formatVND(report.totalOwed) : "—"}</strong></div>
            </div>
            <div className={styles.cardAction}>
              <Button href={`/admin/reports/classes/${report.id}`} variant="secondary">Xem báo cáo lớp</Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
