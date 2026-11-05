import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { ClassForm } from "../_components/ClassForm";
import { getCourses } from "@/mocks/courses";

export const metadata: Metadata = { title: "Thêm lớp | Quản trị" };

export default async function NewClassPage() {
  const courses = await getCourses();
  return (
    <>
      <PageHeader title="Thêm lớp" subtitle="Đặt lịch học và học phí cho lớp mới" />
      <ClassForm mode="new" courses={courses} />
    </>
  );
}
