import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getClasses } from "@/mocks/classes";
import { getTeacherAssignmentOverview } from "@/mocks/teacher-assignments";
import { ClassTable } from "./_components/ClassTable";

export const metadata: Metadata = { title: "Lớp học & điểm danh | Quản trị" };

export default async function ClassesPage() {
  const [classes, teacherAssignments] = await Promise.all([
    getClasses(),
    getTeacherAssignmentOverview(),
  ]);

  return (
    <>
      <PageHeader
        title="Lớp học & điểm danh"
        subtitle={`${classes.length} lớp đang mở · Dữ liệu mẫu`}
        actions={
          <Button href="/admin/classes/new" variant="primary">
            + Thêm lớp
          </Button>
        }
      />
      <Card>
        <ClassTable classes={classes} teacherAssignments={teacherAssignments} />
      </Card>
    </>
  );
}
