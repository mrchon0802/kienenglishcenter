import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { getClasses } from "@/mocks/classes";
import { getStudents } from "@/mocks/students";
import { StudentImport } from "../_components/StudentImport";

export const metadata: Metadata = { title: "Nhập học sinh từ Excel | Quản trị" };

export default async function ImportStudentsPage() {
  const [classes, students] = await Promise.all([getClasses(), getStudents()]);

  return (
    <>
      <PageHeader
        title="Nhập học sinh từ Excel"
        subtitle="Thêm nhiều học sinh cùng lúc từ file .xlsx hoặc .csv"
        actions={<Button href="/admin/students">Về danh sách</Button>}
      />
      <StudentImport
        classNames={classes.map((c) => c.name)}
        existing={students.map((s) => ({ fullName: s.fullName, parentPhone: s.parentPhone }))}
      />
    </>
  );
}
