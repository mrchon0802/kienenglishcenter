import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { formatSessionDate } from "@/lib/schedule";
import { getClassById, getClassStudents, getSessionById } from "@/mocks/classes";
import { AttendanceSheet } from "../../../_components/AttendanceSheet";

export const metadata: Metadata = { title: "Điểm danh | Quản trị" };

type Params = Promise<{ id: string; sessionId: string }>;

async function AttendanceContent({ params }: { params: Params }) {
  const { id, sessionId } = await params;
  const [cls, found, students] = await Promise.all([
    getClassById(id),
    getSessionById(id, sessionId),
    getClassStudents(id),
  ]);
  if (!cls || !found) notFound();

  return (
    <>
      <PageHeader
        title={`Điểm danh lớp ${cls.name}`}
        subtitle={`${formatSessionDate(found.session.date)} · ${found.session.topic}`}
        actions={<Button href={`/admin/classes/${id}`}>Về lớp {cls.name}</Button>}
      />
      {/* key theo buổi học: đổi buổi thì sheet khởi tạo lại từ đầu */}
      <AttendanceSheet key={sessionId} students={students} initial={found.record} />
    </>
  );
}

export default function AttendancePage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<p>Đang tải danh sách điểm danh...</p>}>
      <AttendanceContent params={params} />
    </Suspense>
  );
}
