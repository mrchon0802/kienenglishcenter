"use server";

import { requireTeacherAction } from "@/lib/action-auth";

import { revalidatePath } from "next/cache";
import type { AttendanceRecord } from "@/types/class";
import { getCurrentTeacherId } from "@/lib/current-user";
import { getTeacherAssignments } from "@/mocks/teacher-assignments";
import { saveTeacherAttendance } from "@/mocks/teacher-attendance";
import { getSessionById } from "@/mocks/classes";

export async function saveTeacherAttendanceAction(
  classId: string,
  sessionId: string,
  record: AttendanceRecord,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireTeacherAction();

  const currentTeacherId = await getCurrentTeacherId();

  const assignments = await getTeacherAssignments();
  const session = await getSessionById(classId, sessionId);
  const hasSessionTeacherList = Array.isArray(session?.session.teacherIds);
  const assignedToSession = session?.session.teacherIds?.includes(currentTeacherId) ?? false;
  const canTeachClass = !hasSessionTeacherList && assignments.some((item) =>
    item.teacherId === currentTeacherId && item.classId === classId && !item.endDate,
  );
  if (!assignedToSession && !canTeachClass) return { ok: false, error: "Bạn không được phân công phụ trách buổi học này." };
  const result = await saveTeacherAttendance(classId, sessionId, record, currentTeacherId);
  if (result.ok) {
    revalidatePath(`/teacher/classes/${classId}/attendance`);
    revalidatePath(`/teacher/classes/${classId}/attendance/${sessionId}`);
    revalidatePath("/teacher");
  }
  return result;
}
