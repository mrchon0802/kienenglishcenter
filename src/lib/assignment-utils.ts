import type { Question } from "@/types/question";
import type { AssignmentQuestionSnapshot } from "@/types/assignment";

/** Clone dữ liệu câu hỏi để bài đã giao độc lập với ngân hàng câu hỏi. */
export function snapshotQuestions(questions: Question[], ids: string[]): AssignmentQuestionSnapshot[] {
  return questions.filter((question) => ids.includes(question.id)).map((question) => ({
    ...question,
    options: question.options.map((option) => ({ ...option })),
    correctOptionIds: [...question.correctOptionIds],
    acceptedAnswers: [...question.acceptedAnswers],
    pairs: question.pairs.map((pair) => ({ ...pair })),
    snapshotId: `${question.id}-snapshot`,
    sourceQuestionId: question.id,
  }));
}

export function formatDateTime(value: string): string {
  if (!value) return "Chưa đặt hạn";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export function assignmentKindLabel(kind: "practice" | "test"): string {
  return kind === "practice" ? "Bài luyện tập" : "Bài kiểm tra";
}
