import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { ClassForm } from "../_components/ClassForm";

export const metadata: Metadata = { title: "Thêm lớp | Quản trị" };

export default function NewClassPage() {
  return (
    <>
      <PageHeader title="Thêm lớp" subtitle="Đặt lịch học và học phí cho lớp mới" />
      <ClassForm mode="new" />
    </>
  );
}
