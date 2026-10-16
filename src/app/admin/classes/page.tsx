import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { getClasses } from "@/mocks/classes";
import { ClassTable } from "./_components/ClassTable";

export const metadata: Metadata = { title: "Lớp học & điểm danh | Quản trị" };

export default async function ClassesPage() {
  const classes = await getClasses();

  return (
    <>
      <PageHeader title="Lớp học & điểm danh" subtitle={`${classes.length} lớp đang mở · Dữ liệu mẫu`} />
      <Card>
        <ClassTable classes={classes} />
      </Card>
    </>
  );
}
