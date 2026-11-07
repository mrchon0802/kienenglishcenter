import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { ScheduleTable } from "@/components/schedule/ScheduleTable";
import { getClasses } from "@/mocks/classes";
import { getTeacherAssignments } from "@/mocks/teacher-assignments";
import { getCurrentTeacherId } from "@/lib/current-user";

export const metadata: Metadata = { title: "Lịch giảng dạy | Giáo viên" };

async function ScheduleContent() {
  await connection();
  const currentTeacherId = await getCurrentTeacherId();
  const [classes, assignments] = await Promise.all([getClasses(), getTeacherAssignments()]);
  const assignedIds = new Set(assignments.filter((item) => item.teacherId === currentTeacherId && !item.endDate).map((item) => item.classId));
  const mine = classes.filter((item) => assignedIds.has(item.id));
  return <Card><ScheduleTable classes={mine} title="Lịch giảng dạy của tôi" /></Card>;
}

export default function TeacherSchedulePage() {
  return <><PageHeader title="Lịch giảng dạy" subtitle="Thời gian các lớp bạn đang phụ trách" /><Suspense fallback={<p>Đang tải lịch giảng dạy...</p>}><ScheduleContent /></Suspense></>;
}
