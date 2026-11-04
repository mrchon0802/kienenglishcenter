import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table } from "@/components/ui/Table";
import { formatScore } from "@/lib/format";
import type { Student } from "@/types/student";
import { TransferStudentButton } from "../TransferStudentButton";

interface ClassStudentsTableProps {
  students: Student[];
  /** Các lớp khác (để chuyển lớp). */
  otherClassNames: string[];
}

export function ClassStudentsTable({ students, otherClassNames }: ClassStudentsTableProps) {
  if (students.length === 0) {
    return (
      <EmptyState
        title="Lớp chưa có học sinh"
        description="Chuyển học sinh từ lớp khác vào, hoặc thêm học sinh mới ở phần Ghi danh bên dưới."
      />
    );
  }

  return (
    <Table>
      <thead>
        <tr>
          <th scope="col">Học sinh</th>
          <th scope="col">Mã HS</th>
          <th scope="col">Điểm TB</th>
          <th scope="col">Chuyên cần</th>
          <th scope="col">Học phí</th>
          <th scope="col">
            <span className="sr-only">Thao tác</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {students.map((s) => (
          <tr key={s.id}>
            <td>
              <Link href={`/admin/students/${s.id}`}>{s.fullName}</Link>
            </td>
            <td>{s.code}</td>
            <td>{s.averageScore > 0 ? formatScore(s.averageScore) : "Chưa có"}</td>
            <td>{s.attendanceRate}%</td>
            <td>
              <Badge tone={s.tuitionStatus === "paid" ? "teal" : "amber"}>
                {s.tuitionStatus === "paid" ? "Đã đóng" : "Chưa đóng"}
              </Badge>
            </td>
            <td>
              {otherClassNames.length > 0 ? (
                <TransferStudentButton studentId={s.id} studentName={s.fullName} classNames={otherClassNames} />
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
