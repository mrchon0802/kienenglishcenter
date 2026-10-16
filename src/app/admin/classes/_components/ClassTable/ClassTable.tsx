import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { formatVND } from "@/lib/format";
import { formatSchedule } from "@/lib/schedule";
import type { ClassWithCount } from "@/types/class";

export function ClassTable({ classes }: { classes: ClassWithCount[] }) {
  return (
    <Table>
      <thead>
        <tr>
          <th scope="col">Lớp</th>
          <th scope="col">Lịch học</th>
          <th scope="col">Sĩ số</th>
          <th scope="col">Học phí / tháng</th>
          <th scope="col">Đang học</th>
          <th scope="col">
            <span className="sr-only">Thao tác</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {classes.map((c) => (
          <tr key={c.id}>
            <td>
              <Link href={`/admin/classes/${c.id}`}>Lớp {c.name}</Link>
            </td>
            <td>{formatSchedule(c.scheduleDays, c.startTime, c.endTime)}</td>
            <td>{c.studentCount} học sinh</td>
            <td>{formatVND(c.monthlyFee)}</td>
            <td>Unit {c.currentUnit}</td>
            <td>
              <Button href={`/admin/classes/${c.id}`}>Xem lớp</Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
