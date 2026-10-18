import type { QuestionOption, QuestionType } from "./question";

/**
 * Câu trả lời của học sinh theo dạng câu:
 * mcq: id đáp án | multi: mảng id | truefalse: boolean | fillblank/essay: chuỗi
 * matching: { idVếTrái: idVếPhải } | ordering: mảng từ theo thứ tự học sinh xếp
 */
export type AnswerValue = string | string[] | boolean | Record<string, string>;
export type AnswerMap = Record<string, AnswerValue>;

export interface MatchItem {
  id: string;
  text: string;
}

/** Câu hỏi gửi cho HỌC SINH: tuyệt đối không có đáp án đúng. */
export interface StudentQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  imageUrl: string;
  audioUrl: string;
  points: number;
  options: QuestionOption[]; // mcq, multi
  leftItems: MatchItem[]; // matching
  rightItems: MatchItem[]; // matching (đã xáo trộn)
  words: string[]; // ordering (đã xáo trộn)
}

export type Verdict = "correct" | "wrong" | "pending" | "graded" | "hidden";

export interface ReviewItem {
  questionId: string;
  prompt: string;
  verdict: Verdict;
  earned: number;
  max: number;
  yourAnswer: string;
  correctAnswer?: string; // chỉ có khi được phép hiện đáp án
  explanation?: string;
  teacherComment?: string; // nhận xét khi giáo viên chấm tay
}

export interface SubmissionResult {
  attemptNo: number;
  submittedAt: string;
  late: boolean;
  score: number; // thang 10
  earnedPoints: number;
  maxPoints: number;
  pendingManual: boolean; // còn câu tự luận chờ giáo viên chấm
  answersRevealed: boolean;
  items: ReviewItem[];
}

export type StudentAssignmentStatus = "todo" | "done" | "missed";

export interface StudentAssignmentSummary {
  id: string;
  title: string;
  kind: "practice" | "test";
  dueAt: string;
  questionCount: number;
  durationMinutes: number | null;
  maxAttempts: number | null;
  attemptsUsed: number;
  bestScore: number | null;
  status: StudentAssignmentStatus;
}
