import type { Question } from "./question";
import type { AnswerMap } from "./quiz";

export type AssignmentKind = "practice" | "test";
export type ShowAnswers = "immediately" | "after_deadline" | "never";

export interface Assignment {
  id: string;
  title: string;
  kind: AssignmentKind;
  classId: string;
  dueAt: string; // "yyyy-mm-ddTHH:mm" (giờ địa phương)
  durationMinutes: number | null; // chỉ bài kiểm tra
  maxAttempts: number | null; // null = không giới hạn
  showAnswers: ShowAnswers;
  /** Bản SAO câu hỏi tại thời điểm giao bài: sửa ngân hàng sau này không đổi bài đã giao. */
  questions: Question[];
  createdAt: string;
}

export interface NewAssignmentInput {
  title: string;
  kind: AssignmentKind;
  classId: string;
  dueAt: string;
  durationMinutes: number | null;
  showAnswers: ShowAnswers;
  questionIds: string[];
}

/** Điểm do giáo viên chấm tay cho một câu tự luận. */
export interface ManualGrade {
  score: number;
  comment: string;
}

export interface Attempt {
  id: string;
  assignmentId: string;
  studentId: string;
  attemptNo: number;
  answers: AnswerMap;
  submittedAt: string;
  late: boolean;
  /** questionId -> điểm chấm tay (chỉ có với câu tự luận đã chấm). */
  manualGrades?: Record<string, ManualGrade>;
}

/** Một câu tự luận của một bài nộp, dùng cho màn hình chấm tay. */
export interface EssayGradingItem {
  attemptId: string;
  studentName: string;
  attemptNo: number;
  submittedAt: string;
  questionId: string;
  prompt: string;
  points: number;
  sampleAnswer: string;
  answer: string;
  grade: ManualGrade | null;
}
