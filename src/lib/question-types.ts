import type {
  Difficulty,
  Question,
  QuestionType,
  Skill,
} from "@/types/question";

export const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string; description: string }[] = [
  { value: "mcq", label: "Trắc nghiệm 1 đáp án", description: "Học sinh chọn một đáp án đúng" },
  { value: "multi", label: "Trắc nghiệm nhiều đáp án", description: "Học sinh chọn tất cả đáp án đúng" },
  { value: "truefalse", label: "Đúng / Sai", description: "Nhận định đúng hoặc sai" },
  { value: "fillblank", label: "Điền vào chỗ trống", description: "Gõ từ còn thiếu vào câu" },
  { value: "matching", label: "Nối cặp", description: "Nối từ với nghĩa hoặc hình" },
  { value: "ordering", label: "Sắp xếp từ thành câu", description: "Xếp các từ bị xáo trộn thành câu đúng" },
  { value: "essay", label: "Tự luận (chấm tay)", description: "Giáo viên tự chấm điểm" },
];

export const SKILL_OPTIONS: { value: Skill; label: string }[] = [
  { value: "vocabulary", label: "Từ vựng" },
  { value: "grammar", label: "Ngữ pháp" },
  { value: "reading", label: "Đọc" },
  { value: "listening", label: "Nghe" },
  { value: "writing", label: "Viết" },
];

export const DIFFICULTY_OPTIONS: { value: string; label: string }[] = [
  { value: "1", label: "Dễ" },
  { value: "2", label: "Trung bình" },
  { value: "3", label: "Khó" },
];

export const GRADE_OPTIONS = Array.from({ length: 9 }, (_, i) => ({
  value: String(i + 1),
  label: `Lớp ${i + 1}`,
}));

export function typeLabel(type: QuestionType): string {
  return QUESTION_TYPE_OPTIONS.find((t) => t.value === type)?.label ?? type;
}

export function skillLabel(skill: Skill): string {
  return SKILL_OPTIONS.find((s) => s.value === skill)?.label ?? skill;
}

export function difficultyLabel(difficulty: Difficulty): string {
  return DIFFICULTY_OPTIONS.find((d) => d.value === String(difficulty))?.label ?? "";
}

/** Chỉ gọi trong event handler (không gọi lúc render) để tránh lệch giữa server và client. */
export function newId(): string {
  return `x${Math.random().toString(36).slice(2, 9)}`;
}

export function getSentenceWords(sentence: string): string[] {
  return sentence.trim().split(/\s+/).filter(Boolean);
}

export function createEmptyQuestion(type: QuestionType = "mcq"): Question {
  return {
    id: "new",
    type,
    prompt: "",
    imageUrl: "",
    audioUrl: "",
    points: 1,
    explanation: "",
    grade: 3,
    book: "Sách giáo khoa",
    unit: 1,
    skill: "vocabulary",
    difficulty: 1,
    status: "active",
    createdAt: "",
    options:
      type === "mcq" || type === "multi"
        ? [1, 2, 3, 4].map((n) => ({ id: `opt-${n}`, text: "" }))
        : [],
    correctOptionIds: [],
    trueFalseAnswer: true,
    acceptedAnswers: type === "fillblank" ? [""] : [],
    pairs:
      type === "matching"
        ? [1, 2, 3].map((n) => ({ id: `pair-${n}`, left: "", right: "" }))
        : [],
    sentence: "",
    sampleAnswer: "",
  };
}

/** Đổi dạng câu: giữ nội dung chung và phân loại, làm mới phần đáp án theo dạng mới. */
export function changeQuestionType(question: Question, type: QuestionType): Question {
  const fresh = createEmptyQuestion(type);
  return {
    ...fresh,
    id: question.id,
    prompt: question.prompt,
    imageUrl: question.imageUrl,
    audioUrl: question.audioUrl,
    points: question.points,
    explanation: question.explanation,
    grade: question.grade,
    book: question.book,
    unit: question.unit,
    skill: question.skill,
    difficulty: question.difficulty,
    status: question.status,
    createdAt: question.createdAt,
  };
}

export type QuestionErrors = Partial<
  Record<"prompt" | "points" | "unit" | "options" | "correct" | "answers" | "pairs" | "sentence", string>
>;

export function validateQuestion(q: Question): QuestionErrors {
  const errors: QuestionErrors = {};

  if (!q.prompt.trim()) {
    errors.prompt = "Nhập nội dung câu hỏi.";
  } else if (q.type === "fillblank" && !q.prompt.includes("___")) {
    errors.prompt = 'Câu điền chỗ trống cần có "___" (3 dấu gạch dưới) để đánh dấu chỗ trống.';
  }
  if (!(q.points > 0)) errors.points = "Điểm phải lớn hơn 0.";
  if (!Number.isInteger(q.unit) || q.unit < 1 || q.unit > 30) errors.unit = "Unit từ 1 đến 30.";

  if (q.type === "mcq" || q.type === "multi") {
    const filled = q.options.filter((o) => o.text.trim());
    if (filled.length < 2) {
      errors.options = "Cần ít nhất 2 đáp án có nội dung.";
    } else if (new Set(filled.map((o) => o.text.trim().toLowerCase())).size !== filled.length) {
      errors.options = "Các đáp án không được trùng nhau.";
    }
    const validCorrect = q.correctOptionIds.filter((id) =>
      q.options.some((o) => o.id === id && o.text.trim()),
    );
    if (q.type === "mcq" && validCorrect.length !== 1) errors.correct = "Chọn 1 đáp án đúng.";
    if (q.type === "multi" && validCorrect.length < 1) errors.correct = "Chọn ít nhất 1 đáp án đúng.";
  }

  if (q.type === "fillblank" && q.acceptedAnswers.filter((a) => a.trim()).length < 1) {
    errors.answers = "Nhập ít nhất 1 đáp án đúng.";
  }

  if (q.type === "matching") {
    const ok = q.pairs.length >= 2 && q.pairs.every((p) => p.left.trim() && p.right.trim());
    if (!ok) errors.pairs = "Cần ít nhất 2 cặp, mỗi cặp đủ cả hai vế.";
  }

  if (q.type === "ordering" && getSentenceWords(q.sentence).length < 2) {
    errors.sentence = "Câu đúng cần có ít nhất 2 từ.";
  }

  return errors;
}

/** Tóm tắt đáp án đúng để hiện trong bảng danh sách. */
export function summarizeAnswer(q: Question): string {
  switch (q.type) {
    case "mcq":
    case "multi":
      return q.options
        .filter((o) => q.correctOptionIds.includes(o.id))
        .map((o) => o.text)
        .join(", ");
    case "truefalse":
      return q.trueFalseAnswer ? "Đúng" : "Sai";
    case "fillblank":
      return q.acceptedAnswers.filter((a) => a.trim()).join(" / ");
    case "matching":
      return `${q.pairs.length} cặp`;
    case "ordering":
      return q.sentence;
    case "essay":
      return "Chấm tay";
  }
}
