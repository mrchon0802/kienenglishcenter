import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { formatScore } from "@/lib/format";
import type { AssignmentRow } from "@/types/dashboard";

export function RecentAssignmentsTable({ rows }: { rows: AssignmentRow[] }) {
  return (
    <Card title="Bài tập & kiểm tra gần đây">
      <Table>
        <thead>
          <tr>
            <th scope="col">Tên bài</th>
            <th scope="col">Lớp</th>
            <th scope="col">Loại</th>
            <th scope="col">Hạn nộp</th>
            <th scope="col">Đã nộp</th>
            <th scope="col">Điểm TB</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.title}</td>
              <td>{row.className}</td>
              <td>
                <Badge tone={row.kind === "test" ? "amber" : "teal"}>
                  {row.kind === "test" ? "Kiểm tra" : "Luyện tập"}
                </Badge>
              </td>
              <td>{row.dueDate}</td>
              <td>
                {row.submitted} / {row.total}
              </td>
              <td>{row.averageScore === null ? "-" : formatScore(row.averageScore)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}
