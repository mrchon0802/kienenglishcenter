import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getClassById } from "@/mocks/classes";
import { ClassForm } from "../../_components/ClassForm";

export const metadata: Metadata = { title: "Sửa lớp | Quản trị" };

async function EditClass({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cls = await getClassById(id);
  if (!cls) notFound();

  return (
    <>
      <PageHeader title={`Sửa lớp ${cls.name}`} subtitle="Đổi lịch học, học phí, unit đang học" />
      <ClassForm key={cls.id} mode="edit" cls={cls} />
    </>
  );
}

export default function EditClassPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Đang tải thông tin lớp...</p>}>
      <EditClass params={params} />
    </Suspense>
  );
}
