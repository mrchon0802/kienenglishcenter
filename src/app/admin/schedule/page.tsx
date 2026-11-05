import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { ScheduleTable } from "@/components/schedule/ScheduleTable";
import { getClasses } from "@/mocks/classes";
import { getTeacherAssignmentOverview } from "@/mocks/teacher-assignments";

export const metadata: Metadata = { title: "Thời khóa biểu | Quản trị" };

async function ScheduleContent() {
  await connection();
  const [classes, assignments] = await Promise.all([getClasses(), getTeacherAssignmentOverview()]);
  const teacherByClass = new Map(assignments.map((item) => [item.classId, item.teacherName]));
  const rows = classes.map((item) => ({ ...item, teacherName: teacherByClass.get(item.id) }));
  return <Card><ScheduleTable classes={rows} title="Thời khóa biểu toàn trung tâm" /></Card>;
}

export default function AdminSchedulePage() {
  return <><PageHeader title="Thời khóa biểu" subtitle="Lịch học các lớp và giáo viên phụ trách" /><Suspense fallback={<p>Đang tải thời khóa biểu...</p>}><ScheduleContent /></Suspense></>;
}
