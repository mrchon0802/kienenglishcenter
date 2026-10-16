import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { getClassOptions } from "@/mocks/students";
import { StudentForm } from "../_components/StudentForm";

export const metadata: Metadata = { title: "Thêm học sinh | Quản trị" };

export default async function NewStudentPage() {
  const classes = await getClassOptions();

  return (
    <>
      <PageHeader title="Thêm học sinh" subtitle="Nhập thông tin học sinh và phụ huynh" />
      <StudentForm classes={classes} />
    </>
  );
}
