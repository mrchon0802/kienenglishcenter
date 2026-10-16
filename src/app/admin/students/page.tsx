import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { getClassOptions, getStudents } from "@/mocks/students";
import { StudentsView } from "./_components/StudentsView";

export const metadata: Metadata = { title: "Học sinh | Quản trị" };

export default async function StudentsPage() {
  const [students, classes] = await Promise.all([getStudents(), getClassOptions()]);

  return (
    <>
      <PageHeader
        title="Học sinh"
        subtitle={`${students.length} học sinh · Dữ liệu mẫu`}
        actions={
          <Button href="/admin/students/new" variant="primary">
            + Thêm học sinh
          </Button>
        }
      />
      <StudentsView students={students} classes={classes} />
    </>
  );
}
