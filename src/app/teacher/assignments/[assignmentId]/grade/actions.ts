"use server";

import { requireTeacherAction } from "@/lib/action-auth";

import { revalidatePath } from "next/cache";
import { getCurrentTeacherId } from "@/lib/current-user";
import { getTeacherPortalData } from "@/mocks/teacher-portal";
import { getAssignmentById, getAttemptById, saveManualGrade } from "@/mocks/assignments";

export async function saveTeacherManualGrade(input: { attemptId: string; questionId: string; score: number; comment: string }) {
  await requireTeacherAction();

  const currentTeacherId = await getCurrentTeacherId();

  const attempt = await getAttemptById(input.attemptId);
  if (!attempt) return { ok: false as const, error: "Không tìm thấy bài nộp." };
  const assignment = await getAssignmentById(attempt.assignmentId);
  if (!assignment) return { ok: false as const, error: "Không tìm thấy bài tập." };
  const portal = await getTeacherPortalData(currentTeacherId);
  if (!portal?.classes.some((item) => item.id === assignment.classId)) return { ok: false as const, error: "Bạn không được phân công lớp của bài này." };
  const question = assignment.questions.find((item) => item.id === input.questionId);
  if (!question || question.type !== "essay") return { ok: false as const, error: "Chỉ có thể chấm câu hỏi tự luận." };
  if (!Number.isFinite(input.score) || input.score < 0 || input.score > question.points) return { ok: false as const, error: `Điểm phải từ 0 đến ${question.points}.` };
  if (typeof input.comment !== "string" || input.comment.length > 500) return { ok: false as const, error: "Nhận xét tối đa 500 ký tự." };

  await saveManualGrade(input.attemptId, input.questionId, { score: Math.round(input.score * 100) / 100, comment: input.comment.trim() });
  revalidatePath(`/teacher/assignments/${assignment.id}`);
  revalidatePath(`/teacher/assignments/${assignment.id}/grade`);
  revalidatePath("/student/assignments");
  revalidatePath("/student/scores");
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/gradebook");
  return { ok: true as const };
}
