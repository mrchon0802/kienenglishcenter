import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getClasses } from "@/mocks/classes";
import { getTeachers, getTeacherAccount } from "@/mocks/teachers";
import { getTeacherAssignments } from "@/mocks/teacher-assignments";
import { ScheduleManager } from "./ScheduleManager";

export const metadata: Metadata = { title: "Lịch dạy | Quản trị" };

async function ScheduleContent() {
  await connection();
  const [classes, teachers, assignments] = await Promise.all([
    getClasses(),
    getTeachers(),
    getTeacherAssignments(),
  ]);

  const teacherOptions = await Promise.all(
    teachers.map(async (teacher) => {
      const account = await getTeacherAccount(teacher.id);
      return {
        id: teacher.id,
        name: teacher.fullName,
        code: teacher.teacherCode,
        active: teacher.employmentStatus === "working" && account?.status === "active",
      };
    }),
  );

  const classOptions = classes.map((cls) => ({
    id: cls.id,
    name: cls.name,
    grade: cls.grade,
    days: cls.scheduleSlots?.map((slot) => slot.day) ?? cls.scheduleDays,
    scheduleSlots: cls.scheduleSlots ?? cls.scheduleDays.map((day) => ({ day, startTime: cls.startTime, endTime: cls.endTime })),
    startTime: cls.startTime,
    endTime: cls.endTime,
    studentCount: cls.studentCount,
  }));

  const assignmentRows = assignments.map((assignment) => ({
    id: assignment.id,
    classId: assignment.classId,
    teacherId: assignment.teacherId,
    startDate: assignment.startDate,
    endDate: assignment.endDate ?? null,
    reason: assignment.reason ?? "",
  }));

  return (
    <ScheduleManager
      classes={classOptions}
      teachers={teacherOptions}
      assignments={assignmentRows}
    />
  );
}

export default function AdminSchedulePage() {
  return (
    <>
      <PageHeader
        title="Lịch dạy"
        subtitle="Theo dõi lịch giảng dạy toàn trung tâm và phân công giáo viên phụ trách lớp."
      />
      <Suspense fallback={<p>Đang tải lịch dạy...</p>}>
        <ScheduleContent />
      </Suspense>
    </>
  );
}
