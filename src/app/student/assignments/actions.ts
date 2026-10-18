"use server";

import { revalidatePath } from "next/cache";
import { buildResult } from "@/lib/grading";
import { toLocalInput } from "@/lib/format-datetime";
import { addAttempt, getAssignmentById, getAttempts, studentCanAccess } from "@/mocks/assignments";
import { CURRENT_STUDENT_ID } from "@/mocks/session";
import type { AnswerMap, SubmissionResult } from "@/types/quiz";

type SubmitResponse = { ok: true; result: SubmissionResult } | { ok: false; error: string };

/**
 * Nộp bài và chấm điểm Ở SERVER (giả lập backend). Trình duyệt chỉ gửi câu trả lời, không bao giờ
 * nhận đáp án đúng trước khi được phép hiện.
 * TODO (khi có backend): gọi API POST /assignments/:id/submit, kiểm tra thêm thời gian làm bài.
 */
export async function submitAttemptAction(assignmentId: string, answers: AnswerMap): Promise<SubmitResponse> {
  const assignment = await getAssignmentById(assignmentId);
  if (!assignment || !(await studentCanAccess(assignment, CURRENT_STUDENT_ID))) {
    return { ok: false, error: "Không tìm thấy bài tập." };
  }

  const now = new Date();
  const overdue = now.getTime() > new Date(assignment.dueAt).getTime();
  const prior = await getAttempts(assignmentId, CURRENT_STUDENT_ID);

  if (assignment.kind === "test") {
    if (prior.length >= 1) return { ok: false, error: "Bạn đã nộp bài kiểm tra này rồi." };
    if (overdue) return { ok: false, error: "Bài kiểm tra đã quá hạn nộp." };
  }

  // Chỉ nhận câu trả lời của các câu thuộc bài này.
  const known = new Set(assignment.questions.map((q) => q.id));
  const clean: AnswerMap = Object.fromEntries(Object.entries(answers).filter(([id]) => known.has(id)));

  const attempt = await addAttempt({
    assignmentId,
    studentId: CURRENT_STUDENT_ID,
    attemptNo: prior.length + 1,
    answers: clean,
    submittedAt: toLocalInput(now),
    late: overdue,
  });

  revalidatePath("/student");
  revalidatePath("/student/assignments");
  revalidatePath("/admin/assignments");
  return { ok: true, result: buildResult(assignment, attempt, now) };
}
