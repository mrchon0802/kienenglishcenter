import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { formatDate, formatPhone } from "@/lib/format-date";
import type { Student } from "@/types/student";

export function StudentTable({ students }: { students: Student[] }) {
  return (
    <Table>
      <thead>
        <tr>
          <th scope="col">Mã HS</th>
          <th scope="col">Họ và tên</th>
          <th scope="col">Lớp</th>
          <th scope="col">Phụ huynh</th>
          <th scope="col">Số điện thoại</th>
          <th scope="col">Ngày nhập học</th>
          <th scope="col">Trạng thái</th>
        </tr>
      </thead>
      <tbody>
        {students.map((student) => (
          <tr key={student.id}>
            <td>{student.code}</td>
            <td>
              <Link href={`/admin/students/${student.id}`}>{student.fullName}</Link>
            </td>
            <td>{student.className}</td>
            <td>{student.parentName}</td>
            <td>{formatPhone(student.parentPhone)}</td>
            <td>{formatDate(student.enrolledDate)}</td>
            <td>
              <Badge tone={student.status === "active" ? "teal" : "amber"}>
                {student.status === "active" ? "Đang học" : "Nghỉ học"}
              </Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
