import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LOW_SCORE_THRESHOLD } from "@/lib/constants";
import { formatScore, formatVND } from "@/lib/format";
import type { ClassReportStudentRow } from "@/types/report";
import styles from "./StudentReportList.module.css";

export function StudentReportList({ students }: { students: ClassReportStudentRow[] }) {
  if (students.length === 0) {
    return <p className={styles.empty}>Chưa có dữ liệu học sinh trong lớp.</p>;
  }

  return (
    <div className={styles.list}>
      <div className={styles.desktopTable}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Học sinh</th>
              <th scope="col">TB kiểm tra</th>
              <th scope="col">Chuyên cần</th>
              <th scope="col">Công nợ</th>
              <th scope="col"><span className="sr-only">Thao tác</span></th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={student.studentId}>
                <td>
                  <span className={styles.desktopName}>{student.studentName}</span>
                  <span className={styles.rank}>#{index + 1}</span>
                </td>
                <td>
                  {student.testAverage === null ? "-" : student.testAverage < LOW_SCORE_THRESHOLD ? (
                    <Badge tone="amber">{formatScore(student.testAverage)}</Badge>
                  ) : <strong>{formatScore(student.testAverage)}</strong>}
                </td>
                <td>{student.attendanceRate}%</td>
                <td>
                  {student.owed > 0 ? (
                    <span className={styles.debt}>
                      {formatVND(student.owed)}
                      {student.hasOverdue ? <Badge tone="amber">Quá hạn</Badge> : null}
                    </span>
                  ) : <span className={styles.noDebt}>Không nợ</span>}
                </td>
                <td><Button href={`/admin/reports/students/${student.studentId}`}>Báo cáo</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.mobileList}>
        {students.map((student, index) => (
          <article className={styles.studentCard} key={student.studentId}>
            <div className={styles.cardHeader}>
              <div className={styles.identity}>
                <span className={styles.rank}>#{index + 1}</span>
                <Link className={styles.studentName} href={`/admin/reports/students/${student.studentId}`}>
                  {student.studentName}
                </Link>
              </div>
              {student.hasOverdue && student.owed > 0 ? <Badge tone="amber">Quá hạn</Badge> : null}
            </div>

            <div className={styles.metrics}>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>TB kiểm tra</span>
                <strong className={student.testAverage !== null && student.testAverage < LOW_SCORE_THRESHOLD ? styles.lowScore : ""}>
                  {student.testAverage === null ? "Chưa có" : formatScore(student.testAverage)}
                </strong>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Chuyên cần</span>
                <strong>{student.attendanceRate}%</strong>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Công nợ</span>
                <strong className={student.owed > 0 ? styles.debtValue : styles.noDebt}>
                  {student.owed > 0 ? formatVND(student.owed) : "Không nợ"}
                </strong>
              </div>
            </div>

            <div className={styles.cardAction}>
              <Button href={`/admin/reports/students/${student.studentId}`} variant="secondary">
                Xem báo cáo học sinh
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
