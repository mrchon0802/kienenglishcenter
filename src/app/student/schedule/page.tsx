import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { ScheduleTable } from "@/components/schedule/ScheduleTable";
import { CURRENT_STUDENT_ID } from "@/mocks/session";
import { getClasses } from "@/mocks/classes";
import { getStudents } from "@/mocks/students";

export const metadata: Metadata = { title: "Lịch học | Học sinh" };

async function ScheduleContent() {
  await connection();
  const [classes, students] = await Promise.all([getClasses(), getStudents()]);
  const student = students.find((item) => item.id === CURRENT_STUDENT_ID);
  const mine = classes.filter((item) => item.name === student?.className);
  return <Card><ScheduleTable classes={mine} title={`Lịch học của em${student?.className ? ` · Lớp ${student.className}` : ""}`} /></Card>;
}

export default function StudentSchedulePage() {
  return <><PageHeader title="Lịch học" subtitle="Theo dõi ngày và giờ học của lớp em" /><Suspense fallback={<p>Đang tải lịch học...</p>}><ScheduleContent /></Suspense></>;
}
