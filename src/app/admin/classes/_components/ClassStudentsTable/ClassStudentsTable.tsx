import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table } from "@/components/ui/Table";
import { formatScore } from "@/lib/format";
import type { Student } from "@/types/student";
import { TransferStudentButton } from "../TransferStudentButton";
import styles from "./ClassStudentsTable.module.css";

interface ClassStudentsTableProps { students: Student[]; otherClassNames: string[]; }

export function ClassStudentsTable({ students, otherClassNames }: ClassStudentsTableProps) {
  if (students.length === 0) return <EmptyState title="Lớp chưa có học sinh" description="Chuyển học sinh từ lớp khác vào, hoặc thêm học sinh mới ở phần Ghi danh bên dưới." />;
  return (
    <div className={styles.root}>
      <div className={styles.desktopTable}>
        <Table>
          <thead><tr><th scope="col">Học sinh</th><th scope="col">Mã HS</th><th scope="col">Điểm TB</th><th scope="col">Chuyên cần</th><th scope="col">Học phí</th><th scope="col"><span className="sr-only">Thao tác</span></th></tr></thead>
          <tbody>{students.map((s) => <tr key={s.id}>
            <td><Link href={`/admin/students/${s.id}`}>{s.fullName}</Link></td><td>{s.code}</td><td>{s.averageScore > 0 ? formatScore(s.averageScore) : "Chưa có"}</td><td>{s.attendanceRate}%</td>
            <td><Badge tone={s.tuitionStatus === "paid" ? "teal" : "amber"}>{s.tuitionStatus === "paid" ? "Đã đóng" : "Chưa đóng"}</Badge></td>
            <td>{otherClassNames.length > 0 ? <TransferStudentButton studentId={s.id} studentName={s.fullName} classNames={otherClassNames} /> : null}</td>
          </tr>)}</tbody>
        </Table>
      </div>
      <div className={styles.mobileList}>{students.map((s) => <article className={styles.studentCard} key={s.id}>
        <div className={styles.studentHead}><div><Link href={`/admin/students/${s.id}`}>{s.fullName}</Link><span>{s.code}</span></div><Badge tone={s.tuitionStatus === "paid" ? "teal" : "amber"}>{s.tuitionStatus === "paid" ? "Đã đóng" : "Chưa đóng"}</Badge></div>
        <div className={styles.metrics}><div><span>Điểm TB</span><strong>{s.averageScore > 0 ? formatScore(s.averageScore) : "Chưa có"}</strong></div><div><span>Chuyên cần</span><strong>{s.attendanceRate}%</strong></div></div>
        {otherClassNames.length > 0 ? <div className={styles.transfer}><TransferStudentButton studentId={s.id} studentName={s.fullName} classNames={otherClassNames} /></div> : null}
      </article>)}</div>
    </div>
  );
}
