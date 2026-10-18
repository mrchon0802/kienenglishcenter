"use server";

import { revalidatePath } from "next/cache";
import { getAssignmentById, getAttemptById, saveManualGrade } from "@/mocks/assignments";

type GradeResponse = { ok: true } | { ok: false; error: string };

/**
 * Lưu điểm chấm tay cho một câu tự luận.
 * TODO (khi có backend): gọi API PATCH /attempts/:id/manual-grades.
 */
export async function saveManualGradeAction(input: {
  attemptId: string;
  questionId: string;
  score: number;
  comment: string;
}): Promise<GradeResponse> {
  const attempt = await getAttemptById(input.attemptId);
  if (!attempt) return { ok: false, error: "Không tìm thấy bài nộp." };

  const assignment = await getAssignmentById(attempt.assignmentId);
  const question = assignment?.questions.find((q) => q.id === input.questionId);
  if (!assignment || !question || question.type !== "essay") {
    return { ok: false, error: "Chỉ chấm tay được câu tự luận." };
  }

  if (!Number.isFinite(input.score) || input.score < 0 || input.score > question.points) {
    return { ok: false, error: `Điểm phải từ 0 đến ${question.points}.` };
  }
  if (input.comment.length > 500) return { ok: false, error: "Nhận xét tối đa 500 ký tự." };

  await saveManualGrade(input.attemptId, input.questionId, {
    score: Math.round(input.score * 100) / 100,
    comment: input.comment.trim(),
  });

  revalidatePath(`/admin/assignments/${assignment.id}`);
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/gradebook");
  revalidatePath("/student/assignments");
  revalidatePath("/student/scores");
  return { ok: true };
}
