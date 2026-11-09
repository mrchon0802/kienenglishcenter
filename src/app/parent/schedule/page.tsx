import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { PublishedScheduleList } from "@/components/schedule/PublishedScheduleList";
import { getCurrentStudentId } from "@/lib/current-user";
import { getStudentById } from "@/mocks/students";
import { getClasses } from "@/mocks/classes";
import { getTeachers } from "@/mocks/teachers";
import { getPublishedWeeklySessionsForClass } from "@/mocks/weekly-schedules";

export const metadata: Metadata = { title: "Lịch học | Phụ huynh" };

async function ParentScheduleContent() {
  await connection();
  const studentId = await getCurrentStudentId();
  const [student, classes, teachers] = await Promise.all([
    getStudentById(studentId), getClasses(), getTeachers(),
  ]);
  if (!student) {
    return <Card><p>Không tìm thấy hồ sơ học sinh. Vui lòng liên hệ trung tâm.</p></Card>;
  }
  const mine = classes.filter((item) => item.name === student.className);
  const sessions = mine.flatMap((cls) => getPublishedWeeklySessionsForClass(cls.id))
    .map((session) => ({
      id: session.id,
      className: student.className,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      teacherNames: session.teacherIds.map((id) => teachers.find((teacher) => teacher.id === id)?.fullName ?? id),
      type: session.type ?? "regular",
    }));
  return <Card><PublishedScheduleList items={sessions} title={`Lịch học của ${student.fullName}`} /></Card>;
}

export default function ParentSchedulePage() {
  return <><PageHeader title="Lịch học" subtitle="Theo dõi lịch học đã được trung tâm công bố" /><Suspense fallback={<p>Đang tải lịch học...</p>}><ParentScheduleContent /></Suspense></>;
}
