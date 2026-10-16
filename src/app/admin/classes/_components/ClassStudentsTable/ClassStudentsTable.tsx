import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table } from "@/components/ui/Table";
import { formatScore } from "@/lib/format";
import type { Student } from "@/types/student";

export function ClassStudentsTable({ students }: { students: Student[] }) {
  if (students.length === 0) {
    return (
      <EmptyState
        title="Lớp chưa có học sinh"
        description="Thêm học sinh vào lớp ở bước ghi danh (sẽ làm tiếp)."
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
        </tr>
      </thead>
      <tbody>
        {students.map((s) => (
          <tr key={s.id}>
            <td>
              <Link href={`/admin/students/${s.id}`}>{s.fullName}</Link>
            </td>
            <td>{s.code}</td>
            <td>{formatScore(s.averageScore)}</td>
            <td>{s.attendanceRate}%</td>
            <td>
              <Badge tone={s.tuitionStatus === "paid" ? "teal" : "amber"}>
                {s.tuitionStatus === "paid" ? "Đã đóng" : "Chưa đóng"}
              </Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
