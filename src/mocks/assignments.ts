/**
 * Kho dữ liệu GIẢ LẬP trong bộ nhớ server, lưu trong globalThis để giữ nguyên giữa các request.
 * Chỉ dùng khi dev: mất khi khởi động lại server. Backend thật (NestJS + MongoDB) sẽ thay thế file này.
 */
import { buildResult } from "@/lib/grading";
import { toLocalInput } from "@/lib/format-datetime";
import type { Assignment, Attempt, EssayGradingItem, ManualGrade, NewAssignmentInput } from "@/types/assignment";
import type { Question } from "@/types/question";
import type { AnswerMap, StudentAssignmentSummary } from "@/types/quiz";
import { getClassStudents } from "./classes";
import { getQuestionById } from "./questions";
import { getStudentById } from "./students";

interface Store {
  assignments: Assignment[];
  attempts: Attempt[];
  counter: number;
}

const g = globalThis as unknown as { __ecAssignmentStore?: Store };

function shift(base: Date, days: number, hour = 20): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return toLocalInput(d);
}

async function snapshot(ids: string[]): Promise<Question[]> {
  const list: Question[] = [];
  for (const id of ids) {
    const q = await getQuestionById(id);
    if (q) list.push(structuredClone(q));
  }
  return list;
}

async function seed(): Promise<Store> {
  const now = new Date();
  const assignments: Assignment[] = [
    { id: "a-101", title: "Kiểm tra Unit 4", kind: "test", classId: "3a", dueAt: shift(now, 2), durationMinutes: 20, maxAttempts: 1, showAnswers: "after_deadline", questions: await snapshot(["q-001", "q-002", "q-003", "q-004", "q-005", "q-007", "q-008"]), createdAt: shift(now, -1) },
    { id: "a-102", title: "Luyện tập Unit 4", kind: "practice", classId: "3a", dueAt: shift(now, 5), durationMinutes: null, maxAttempts: null, showAnswers: "immediately", questions: await snapshot(["q-002", "q-005", "q-006", "q-010", "q-009"]), createdAt: shift(now, -2) },
    { id: "a-103", title: "Kiểm tra Unit 3", kind: "test", classId: "3a", dueAt: shift(now, -3), durationMinutes: 15, maxAttempts: 1, showAnswers: "after_deadline", questions: await snapshot(["q-002", "q-004", "q-005"]), createdAt: shift(now, -6) },
    { id: "a-201", title: "Kiểm tra Unit 5", kind: "test", classId: "4a", dueAt: shift(now, 1), durationMinutes: 20, maxAttempts: 1, showAnswers: "after_deadline", questions: await snapshot(["q-001", "q-006", "q-008"]), createdAt: shift(now, -2) },
  ];

  const mk = (studentId: string, answers: AnswerMap, n: number, assignmentId = "a-103"): Attempt => ({
    id: `at-seed-${n}`,
    assignmentId,
    studentId,
    attemptNo: 1,
    answers,
    submittedAt: shift(now, -4, 19),
    late: false,
  });

  return {
    assignments,
    counter: 1,
    attempts: [
      mk("hs-002", { "q-002": "1", "q-004": true, "q-005": "is" }, 1),
      mk("hs-007", { "q-002": "2", "q-004": false, "q-005": "is" }, 2),
      mk("hs-012", { "q-002": "1", "q-004": true, "q-005": "are" }, 3),
      // Bài luyện tập có câu tự luận: để có bài mẫu cho màn hình chấm tay.
      mk("hs-007", { "q-002": "1", "q-005": "is", "q-006": "seven", "q-010": "1", "q-009": "There are four people in my family. I love them very much." }, 4, "a-102"),
      mk("hs-012", { "q-002": "1", "q-005": "am", "q-006": "7", "q-010": "2", "q-009": "My family is big." }, 5, "a-102"),
    ],
  };
}

async function store(): Promise<Store> {
  if (!g.__ecAssignmentStore) g.__ecAssignmentStore = await seed();
  return g.__ecAssignmentStore;
}

// ---------- đọc / ghi ----------
export async function getAssignments(): Promise<Assignment[]> {
  const s = await store();
  return [...s.assignments].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAssignmentById(id: string): Promise<Assignment | undefined> {
  return (await store()).assignments.find((a) => a.id === id);
}

export async function createAssignment(input: NewAssignmentInput): Promise<Assignment> {
  const s = await store();
  s.counter += 1;
  const assignment: Assignment = {
    id: `a-${900 + s.counter}`,
    title: input.title.trim(),
    kind: input.kind,
    classId: input.classId,
    dueAt: input.dueAt,
    durationMinutes: input.kind === "test" ? input.durationMinutes : null,
    maxAttempts: input.kind === "test" ? 1 : null,
    showAnswers: input.showAnswers,
    questions: await snapshot(input.questionIds), // sao chép câu hỏi tại thời điểm giao bài
    createdAt: toLocalInput(new Date()),
  };
  s.assignments.push(assignment);
  return assignment;
}

export async function getAttempts(assignmentId: string, studentId?: string): Promise<Attempt[]> {
  const s = await store();
  return s.attempts.filter((a) => a.assignmentId === assignmentId && (!studentId || a.studentId === studentId));
}

export async function addAttempt(attempt: Omit<Attempt, "id">): Promise<Attempt> {
  const s = await store();
  s.counter += 1;
  const saved = { ...attempt, id: `at-${s.counter}` };
  s.attempts.push(saved);
  return saved;
}

// ---------- tổng hợp cho admin ----------
export interface SubmissionRow {
  studentId: string;
  studentName: string;
  attempts: number;
  bestScore: number | null;
  pendingManual: boolean;
  lastSubmittedAt: string | null;
}

export async function getSubmissionRows(assignment: Assignment, now: Date): Promise<SubmissionRow[]> {
  const students = await getClassStudents(assignment.classId);
  const attempts = await getAttempts(assignment.id);
  return students.map((student) => {
    const mine = attempts.filter((a) => a.studentId === student.id);
    const results = mine.map((a) => buildResult(assignment, a, now));
    return {
      studentId: student.id,
      studentName: student.fullName,
      attempts: mine.length,
      bestScore: results.length ? Math.max(...results.map((r) => r.score)) : null,
      pendingManual: results.some((r) => r.pendingManual),
      lastSubmittedAt: mine.length ? mine[mine.length - 1].submittedAt : null,
    };
  });
}

export async function getAssignmentStats(assignment: Assignment, now: Date) {
  const rows = await getSubmissionRows(assignment, now);
  const done = rows.filter((r) => r.bestScore !== null);
  return {
    submitted: done.length,
    total: rows.length,
    averageScore: done.length ? done.reduce((sum, r) => sum + (r.bestScore ?? 0), 0) / done.length : null,
  };
}

// ---------- cho học sinh ----------
function summarize(a: Assignment, attempts: Attempt[], now: Date): StudentAssignmentSummary {
  const scores = attempts.map((at) => buildResult(a, at, now).score);
  const overdue = now.getTime() > new Date(a.dueAt).getTime();
  const status =
    attempts.length > 0 ? "done" : a.kind === "test" && overdue ? "missed" : "todo";
  return {
    id: a.id,
    title: a.title,
    kind: a.kind,
    dueAt: a.dueAt,
    questionCount: a.questions.length,
    durationMinutes: a.durationMinutes,
    maxAttempts: a.maxAttempts,
    attemptsUsed: attempts.length,
    bestScore: scores.length ? Math.max(...scores) : null,
    status,
  };
}

export async function getStudentAssignments(studentId: string, now: Date): Promise<StudentAssignmentSummary[]> {
  const student = await getStudentById(studentId);
  if (!student) return [];
  const classId = student.className.toLowerCase();
  const s = await store();
  return s.assignments
    .filter((a) => a.classId === classId)
    .map((a) => summarize(a, s.attempts.filter((at) => at.assignmentId === a.id && at.studentId === studentId), now))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

export async function studentCanAccess(assignment: Assignment, studentId: string): Promise<boolean> {
  const student = await getStudentById(studentId);
  return Boolean(student && student.className.toLowerCase() === assignment.classId);
}

// ---------- chấm tay câu tự luận ----------
export async function getAttemptById(id: string): Promise<Attempt | undefined> {
  return (await store()).attempts.find((a) => a.id === id);
}

export async function saveManualGrade(attemptId: string, questionId: string, grade: ManualGrade): Promise<boolean> {
  const attempt = await getAttemptById(attemptId);
  if (!attempt) return false;
  attempt.manualGrades = { ...(attempt.manualGrades ?? {}), [questionId]: grade };
  return true;
}

/** Danh sách câu tự luận của mọi bài nộp, câu chưa chấm lên trước. */
export async function getEssayGradingItems(assignment: Assignment): Promise<EssayGradingItem[]> {
  const essays = assignment.questions.filter((q) => q.type === "essay");
  const attempts = await getAttempts(assignment.id);
  const items: EssayGradingItem[] = [];

  for (const attempt of attempts) {
    const student = await getStudentById(attempt.studentId);
    for (const q of essays) {
      const raw = attempt.answers[q.id];
      const answer = typeof raw === "string" ? raw.trim() : "";
      if (!answer) continue; // bỏ trống thì tự tính 0 điểm, không cần chấm
      items.push({
        attemptId: attempt.id,
        studentName: student?.fullName ?? attempt.studentId,
        attemptNo: attempt.attemptNo,
        submittedAt: attempt.submittedAt,
        questionId: q.id,
        prompt: q.prompt,
        points: q.points,
        sampleAnswer: q.sampleAnswer,
        answer,
        grade: attempt.manualGrades?.[q.id] ?? null,
      });
    }
  }
  return items.sort((a, b) => Number(a.grade !== null) - Number(b.grade !== null) || a.submittedAt.localeCompare(b.submittedAt));
}
