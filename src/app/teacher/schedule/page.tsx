import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { PublishedScheduleList } from "@/components/schedule/PublishedScheduleList";
import { getClasses } from "@/mocks/classes";
import { getTeacherAssignments } from "@/mocks/teacher-assignments";
import { getPublishedWeeklySessionsForClass } from "@/mocks/weekly-schedules";
import { getTeachers } from "@/mocks/teachers";
import { getCurrentTeacherId } from "@/lib/current-user";

export const metadata: Metadata = { title: "Lịch giảng dạy | Giáo viên" };

async function ScheduleContent() {
  await connection();
  const currentTeacherId = await getCurrentTeacherId();
  const [classes, assignments, teachers] = await Promise.all([getClasses(), getTeacherAssignments(), getTeachers()]);
  const classMap = new Map(classes.map((item) => [item.id, item]));
  const sessions = classes.flatMap((cls) => getPublishedWeeklySessionsForClass(cls.id))
    .filter((session) => session.teacherIds.includes(currentTeacherId))
    .map((session) => ({ id: session.id, className: classMap.get(session.classId)?.name ?? session.classId, date: session.date, startTime: session.startTime, endTime: session.endTime, teacherNames: session.teacherIds.map((id) => teachers.find((teacher) => teacher.id === id)?.fullName ?? id), type: session.type ?? "regular" }));
  const assignedIds = new Set(assignments.filter((item) => item.teacherId === currentTeacherId && !item.endDate).map((item) => item.classId));
  const empty = assignedIds.size ? "Admin chưa công bố lịch cho các lớp bạn phụ trách." : "Bạn chưa được phân công lớp học.";
  return <Card><PublishedScheduleList items={sessions} title="Lịch giảng dạy của tôi" empty={empty} /></Card>;
}

export default function TeacherSchedulePage() {
  return <><PageHeader title="Lịch giảng dạy" subtitle="Thời gian các lớp bạn đang phụ trách" /><Suspense fallback={<p>Đang tải lịch giảng dạy...</p>}><ScheduleContent /></Suspense></>;
}
