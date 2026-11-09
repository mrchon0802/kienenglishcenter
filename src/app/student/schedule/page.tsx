import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { PublishedScheduleList } from "@/components/schedule/PublishedScheduleList";
import { getCurrentStudentId } from "@/lib/current-user";
import { getClasses } from "@/mocks/classes";
import { getStudents } from "@/mocks/students";
import { getPublishedWeeklySessionsForClass } from "@/mocks/weekly-schedules";
import { getTeachers } from "@/mocks/teachers";

export const metadata: Metadata = { title: "Lịch học | Học sinh" };

async function ScheduleContent() {
  await connection();
  const currentStudentId = await getCurrentStudentId();
  const [classes, students, teachers] = await Promise.all([getClasses(), getStudents(), getTeachers()]);
  const student = students.find((item) => item.id === currentStudentId);
  const mine = classes.filter((item) => item.name === student?.className);
  const sessions = mine.flatMap((cls) => getPublishedWeeklySessionsForClass(cls.id))
    .map((session) => ({ id: session.id, className: mine.find((cls) => cls.id === session.classId)?.name ?? session.classId, date: session.date, startTime: session.startTime, endTime: session.endTime, teacherNames: session.teacherIds.map((id) => teachers.find((teacher) => teacher.id === id)?.fullName ?? id), type: session.type ?? "regular" }));
  return <Card><PublishedScheduleList items={sessions} title={`Lịch học của em${student?.className ? ` · Lớp ${student.className}` : ""}`} /></Card>;
}

export default function StudentSchedulePage() {
  return <><PageHeader title="Lịch học" subtitle="Theo dõi ngày và giờ học của lớp em" /><Suspense fallback={<p>Đang tải lịch học...</p>}><ScheduleContent /></Suspense></>;
}
