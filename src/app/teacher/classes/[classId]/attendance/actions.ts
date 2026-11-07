"use server";

import { requireTeacherAction } from "@/lib/action-auth";

import { revalidatePath } from "next/cache";
import type { AttendanceRecord } from "@/types/class";
import { getCurrentTeacherId } from "@/lib/current-user";
import { getTeacherAssignments } from "@/mocks/teacher-assignments";
import { saveTeacherAttendance } from "@/mocks/teacher-attendance";

export async function saveTeacherAttendanceAction(
  classId: string,
  sessionId: string,
  record: AttendanceRecord,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireTeacherAction();

  const currentTeacherId = await getCurrentTeacherId();

  const assignments = await getTeacherAssignments();
  const canTeachClass = assignments.some((item) =>
    item.teacherId === currentTeacherId && item.classId === classId && !item.endDate,
  );
  if (!canTeachClass) return { ok: false, error: "Bạn không được phân công phụ trách lớp này." };
  const result = await saveTeacherAttendance(classId, sessionId, record, currentTeacherId);
  if (result.ok) {
    revalidatePath(`/teacher/classes/${classId}/attendance`);
    revalidatePath(`/teacher/classes/${classId}/attendance/${sessionId}`);
    revalidatePath("/teacher");
  }
  return result;
}
