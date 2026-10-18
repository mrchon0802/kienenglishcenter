import { buildResult, toStudentQuestion } from "@/lib/grading";
import type { StudentAssignmentSummary, StudentQuestion, SubmissionResult } from "@/types/quiz";
import { getAssignmentById, getAttempts, getStudentAssignments, studentCanAccess } from "./assignments";

export interface StudentAssignmentView {
  info: StudentAssignmentSummary;
  questions: StudentQuestion[]; // KHÔNG có đáp án đúng
  lastResult: SubmissionResult | null;
  canAttempt: boolean;
  blockedReason?: string;
}

export async function getStudentAssignmentView(
  assignmentId: string,
  studentId: string,
  now: Date,
): Promise<StudentAssignmentView | null> {
  const assignment = await getAssignmentById(assignmentId);
  if (!assignment || !(await studentCanAccess(assignment, studentId))) return null;

  const [summaries, attempts] = await Promise.all([
    getStudentAssignments(studentId, now),
    getAttempts(assignmentId, studentId),
  ]);
  const info = summaries.find((s) => s.id === assignmentId);
  if (!info) return null;

  const last = attempts[attempts.length - 1];
  const lastResult = last ? buildResult(assignment, last, now) : null;

  let canAttempt = true;
  let blockedReason: string | undefined;
  if (assignment.kind === "test") {
    if (attempts.length >= 1) {
      canAttempt = false;
      blockedReason = "Bạn đã nộp bài kiểm tra này.";
    } else if (now.getTime() > new Date(assignment.dueAt).getTime()) {
      canAttempt = false;
      blockedReason = "Bài kiểm tra đã quá hạn nộp. Hãy báo giáo viên nếu bạn cần được mở lại.";
    }
  }

  return {
    info,
    questions: assignment.questions.map(toStudentQuestion),
    lastResult,
    canAttempt,
    blockedReason,
  };
}
