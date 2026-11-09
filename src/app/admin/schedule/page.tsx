import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getClasses } from "@/mocks/classes";
import { getTeachers, getTeacherAccount } from "@/mocks/teachers";
import { getTeacherAssignments } from "@/mocks/teacher-assignments";
import { getOrCreateWeek, getMonday, getScheduleAuditLogs } from "@/mocks/weekly-schedules";
import { ScheduleManager } from "./ScheduleManager";

export const metadata: Metadata = { title: "Lịch dạy | Quản trị" };
function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
async function ScheduleContent() {
  await connection();
  const [classes, teachers, assignments] = await Promise.all([getClasses(), getTeachers(), getTeacherAssignments()]);
  const teacherOptions = await Promise.all(teachers.map(async (teacher) => {
    const account = await getTeacherAccount(teacher.id);
    return { id: teacher.id, name: teacher.fullName, code: teacher.teacherCode, active: teacher.employmentStatus === "working" && account?.status === "active" };
  }));
  const week = getOrCreateWeek(getMonday(todayKey()), classes, assignments);
  const auditLogs = getScheduleAuditLogs(week.weekStart);
  const classOptions = classes.map((cls) => ({ id: cls.id, name: cls.name, grade: cls.grade, studentCount: cls.studentCount }));
  return <ScheduleManager classes={classOptions} teachers={teacherOptions} initialWeek={week} initialAuditLogs={auditLogs} />;
}
export default function AdminSchedulePage() {
  return <><PageHeader title="Lịch dạy" subtitle="Lập lịch từng tuần, phân công nhiều giáo viên và công bố lịch học." /><Suspense fallback={<p>Đang tải lịch dạy...</p>}><ScheduleContent /></Suspense></>;
}
