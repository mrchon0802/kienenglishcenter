"use server";

import { revalidatePath } from "next/cache";
import type { AttendanceRecord } from "@/types/class";
import { DEMO_CENTER_USER } from "@/mocks/teacher-session";
import { getTeacherAssignments } from "@/mocks/teacher-assignments";
import { saveTeacherAttendance } from "@/mocks/teacher-attendance";

export async function saveTeacherAttendanceAction(
  classId: string,
  sessionId: string,
  record: AttendanceRecord,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const assignments = await getTeacherAssignments();
  const canTeachClass = assignments.some((item) =>
    item.teacherId === DEMO_CENTER_USER.teacherId && item.classId === classId && !item.endDate,
  );
  if (!canTeachClass) return { ok: false, error: "Bạn không được phân công phụ trách lớp này." };
  const result = await saveTeacherAttendance(classId, sessionId, record, DEMO_CENTER_USER.teacherId);
  if (result.ok) {
    revalidatePath(`/teacher/classes/${classId}/attendance`);
    revalidatePath(`/teacher/classes/${classId}/attendance/${sessionId}`);
    revalidatePath("/teacher");
  }
  return result;
}
