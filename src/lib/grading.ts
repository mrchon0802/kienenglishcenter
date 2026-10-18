/**
 * LOGIC CHẤM ĐIỂM (giả lập backend). Chỉ được gọi ở phía SERVER (server action, server component).
 * Khi có NestJS: chuyển toàn bộ file này sang backend. Frontend không bao giờ import file này trong
 * "use client".
 */
import type { Assignment, Attempt, ManualGrade } from "@/types/assignment";
import type { Question } from "@/types/question";
import type {
  AnswerValue,
  MatchItem,
  ReviewItem,
  StudentQuestion,
  SubmissionResult,
  Verdict,
} from "@/types/quiz";
import { getSentenceWords } from "./question-types";

export function normalizeAnswer(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

// --- Nối cặp: vế phải được xoay 1 vị trí và đổi sang id không liên quan tới cặp gốc.
// (Bản giả lập. Backend thật nên xáo ngẫu nhiên và lưu phép ánh xạ.)
function rightItemsFor(q: Question): MatchItem[] {
  const n = q.pairs.length;
  return q.pairs.map((_, i) => ({ id: `r${i + 1}`, text: q.pairs[(i + 1) % n].right }));
}

function expectedRightId(q: Question, pairIndex: number): string {
  const n = q.pairs.length;
  return `r${((pairIndex - 1 + n) % n) + 1}`;
}

function shuffledWords(sentence: string): string[] {
  const words = getSentenceWords(sentence);
  const reversed = [...words].reverse();
  if (reversed.join(" ") !== words.join(" ")) return reversed;
  return words.length < 2 ? words : [...words.slice(1), words[0]];
}

/** Bỏ mọi đáp án đúng trước khi gửi xuống trình duyệt học sinh. */
export function toStudentQuestion(q: Question): StudentQuestion {
  return {
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    imageUrl: q.imageUrl,
    audioUrl: q.audioUrl,
    points: q.points,
    options: q.type === "mcq" || q.type === "multi" ? q.options.map((o) => ({ id: o.id, text: o.text })) : [],
    leftItems: q.type === "matching" ? q.pairs.map((p) => ({ id: p.id, text: p.left })) : [],
    rightItems: q.type === "matching" ? rightItemsFor(q) : [],
    words: q.type === "ordering" ? shuffledWords(q.sentence) : [],
  };
}

interface Graded {
  correct: boolean | null; // null = chờ giáo viên chấm
  earned: number;
}

export function gradeQuestion(q: Question, answer: AnswerValue | undefined, manual?: ManualGrade): Graded {
  if (q.type === "essay") {
    // Giáo viên đã chấm: lấy điểm đã chấm. Bỏ trống: 0 điểm, không cần chấm. Còn lại: chờ chấm tay.
    if (manual) return { correct: manual.score >= q.points, earned: Math.min(Math.max(manual.score, 0), q.points) };
    const blank = typeof answer !== "string" || answer.trim() === "";
    return blank ? { correct: false, earned: 0 } : { correct: null, earned: 0 };
  }
  if (answer === undefined) return { correct: false, earned: 0 };
  const full = (ok: boolean): Graded => ({ correct: ok, earned: ok ? q.points : 0 });

  switch (q.type) {
    case "mcq":
      return full(typeof answer === "string" && q.correctOptionIds[0] === answer);
    case "multi": {
      if (!Array.isArray(answer)) return full(false);
      const given = new Set(answer);
      const want = new Set(q.correctOptionIds);
      return full(given.size === want.size && [...want].every((id) => given.has(id)));
    }
    case "truefalse":
      return full(typeof answer === "boolean" && answer === q.trueFalseAnswer);
    case "fillblank": {
      if (typeof answer !== "string") return full(false);
      const given = normalizeAnswer(answer);
      return full(q.acceptedAnswers.some((a) => a.trim() && normalizeAnswer(a) === given));
    }
    case "matching": {
      if (typeof answer !== "object" || Array.isArray(answer)) return full(false);
      const map = answer as Record<string, string>;
      const right = q.pairs.filter((p, k) => map[p.id] === expectedRightId(q, k)).length;
      return {
        correct: right === q.pairs.length,
        earned: Math.round((q.points * right) / q.pairs.length * 100) / 100, // chấm theo từng cặp
      };
    }
    case "ordering": {
      if (!Array.isArray(answer)) return full(false);
      return full(normalizeAnswer(answer.join(" ")) === normalizeAnswer(q.sentence));
    }
  }
}

export function answerToText(q: Question, answer: AnswerValue | undefined): string {
  const none = "(chưa trả lời)";
  if (answer === undefined) return none;
  switch (q.type) {
    case "mcq":
      return q.options.find((o) => o.id === answer)?.text ?? none;
    case "multi":
      return Array.isArray(answer)
        ? q.options.filter((o) => answer.includes(o.id)).map((o) => o.text).join(", ") || none
        : none;
    case "truefalse":
      return typeof answer === "boolean" ? (answer ? "Đúng" : "Sai") : none;
    case "fillblank":
    case "essay":
      return typeof answer === "string" && answer.trim() ? answer : none;
    case "matching": {
      if (typeof answer !== "object" || Array.isArray(answer)) return none;
      const rights = rightItemsFor(q);
      const parts = q.pairs
        .filter((p) => (answer as Record<string, string>)[p.id])
        .map((p) => `${p.left} → ${rights.find((r) => r.id === (answer as Record<string, string>)[p.id])?.text ?? "?"}`);
      return parts.join("; ") || none;
    }
    case "ordering":
      return Array.isArray(answer) && answer.length ? answer.join(" ") : none;
  }
}

export function correctAnswerText(q: Question): string {
  switch (q.type) {
    case "mcq":
    case "multi":
      return q.options.filter((o) => q.correctOptionIds.includes(o.id)).map((o) => o.text).join(", ");
    case "truefalse":
      return q.trueFalseAnswer ? "Đúng" : "Sai";
    case "fillblank":
      return q.acceptedAnswers.filter((a) => a.trim()).join(" / ");
    case "matching":
      return q.pairs.map((p) => `${p.left} → ${p.right}`).join("; ");
    case "ordering":
      return q.sentence;
    case "essay":
      return q.sampleAnswer.trim() || "Giáo viên sẽ chấm câu này.";
  }
}

export function canRevealAnswers(assignment: Assignment, now: Date): boolean {
  if (assignment.showAnswers === "immediately") return true;
  if (assignment.showAnswers === "never") return false;
  return now.getTime() > new Date(assignment.dueAt).getTime();
}

export function buildResult(assignment: Assignment, attempt: Attempt, now: Date): SubmissionResult {
  const revealed = canRevealAnswers(assignment, now);
  let earnedPoints = 0;
  let maxPoints = 0;
  let pendingManual = false;

  const items: ReviewItem[] = assignment.questions.map((q) => {
    const manual = attempt.manualGrades?.[q.id];
    const { correct, earned } = gradeQuestion(q, attempt.answers[q.id], manual);
    earnedPoints += earned;
    maxPoints += q.points;
    if (correct === null) pendingManual = true;

    const verdict: Verdict =
      correct === null ? "pending" : !revealed ? "hidden" : manual ? "graded" : correct ? "correct" : "wrong";
    return {
      questionId: q.id,
      prompt: q.prompt,
      verdict,
      earned: revealed || correct === null ? earned : 0,
      max: q.points,
      yourAnswer: answerToText(q, attempt.answers[q.id]),
      correctAnswer: revealed ? correctAnswerText(q) : undefined,
      explanation: revealed && q.explanation.trim() ? q.explanation : undefined,
      teacherComment: revealed && manual?.comment.trim() ? manual.comment : undefined,
    };
  });

  return {
    attemptNo: attempt.attemptNo,
    submittedAt: attempt.submittedAt,
    late: attempt.late,
    score: maxPoints ? Math.round((earnedPoints / maxPoints) * 100) / 10 : 0,
    earnedPoints: Math.round(earnedPoints * 100) / 100,
    maxPoints,
    pendingManual,
    answersRevealed: revealed,
    items,
  };
}
