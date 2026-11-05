"use server";
import { revalidatePath } from "next/cache";
import { DEMO_CENTER_USER } from "@/mocks/teacher-session";
import { saveTeacherSessionCompletion, getTeacherSessionCompletion, attachCompletionAssignment } from "@/mocks/teacher-session-completions";
import { getClassStudents } from "@/mocks/classes";
import { publishTeacherAssignment } from "@/app/teacher/assignments/actions";
import { createAssignmentNotifications } from "@/mocks/student-notifications";
import type { TeacherSessionCompletionInput } from "@/types/teacher-session-completion";

export async function saveSessionCompletionAction(input: TeacherSessionCompletionInput) {
  const result = await saveTeacherSessionCompletion(DEMO_CENTER_USER.teacherId, input);
  if (!result.ok) return result;
  revalidatePath(`/teacher/classes/${input.classId}/attendance`);
  revalidatePath(`/teacher/classes/${input.classId}/sessions/${input.sessionId}/complete`);
  revalidatePath("/teacher/reports");
  return result;
}

export async function publishHomeworkAfterSessionAction(input: TeacherSessionCompletionInput, homework: { title: string; dueAt: string; questionIds: string[]; newQuestions: import("@/types/question").Question[] }) {
  const saved = await saveTeacherSessionCompletion(DEMO_CENTER_USER.teacherId, input);
  if (!saved.ok) return saved;
  const existing = await getTeacherSessionCompletion(input.classId, input.sessionId, DEMO_CENTER_USER.teacherId);
  if (existing?.autoAssignmentId) return { ok: true as const, assignmentId: existing.autoAssignmentId, alreadyPublished: true };
  if (!homework.title.trim()) return { ok: false as const, error: "Vui lòng nhập tên bài tập." };
  if (!homework.questionIds.length && !homework.newQuestions.length) return { ok: false as const, error: "Hãy chọn hoặc tạo ít nhất một câu hỏi." };
  const published = await publishTeacherAssignment({ title: homework.title, kind: "practice", classId: input.classId, dueAt: homework.dueAt, durationMinutes: null, showAnswers: "after_deadline", questionIds: homework.questionIds, newQuestions: homework.newQuestions });
  if (!published.ok) return published;
  const attached = await attachCompletionAssignment(input.classId, input.sessionId, DEMO_CENTER_USER.teacherId, published.assignmentId);
  if (!attached) return { ok: false as const, error: "Bài đã tạo nhưng chưa liên kết được với biên bản. Vui lòng báo quản trị viên trước khi thử lại." };
  const students = await getClassStudents(input.classId);
  await createAssignmentNotifications(published.assignmentId, homework.title, input.classId, students.map((student) => student.id));
  revalidatePath("/student"); revalidatePath("/student/assignments"); revalidatePath("/student/notifications"); revalidatePath("/teacher/assignments"); revalidatePath("/teacher/reports");
  return { ok: true as const, assignmentId: published.assignmentId, alreadyPublished: false };
}
