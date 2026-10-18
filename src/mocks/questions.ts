import { createEmptyQuestion } from "@/lib/question-types";
import type { Question } from "@/types/question";

type Seed = Partial<Question> & Pick<Question, "id" | "type" | "prompt">;

function make(seed: Seed): Question {
  return { ...createEmptyQuestion(seed.type), createdAt: "2026-10-01", ...seed };
}

function opts(...texts: string[]) {
  return texts.map((text, i) => ({ id: `${i + 1}`, text }));
}

const questions: Question[] = [
  make({ id: "q-001", type: "mcq", prompt: "She ___ to school every day.", grade: 4, unit: 3, skill: "grammar", options: opts("go", "goes", "going", "gone"), correctOptionIds: ["2"], explanation: "Chủ ngữ ngôi thứ ba số ít (she) thì động từ thêm -es." }),
  make({ id: "q-002", type: "mcq", prompt: "Từ nào có nghĩa là \"con mèo\"?", grade: 1, unit: 2, options: opts("cat", "dog", "bird", "fish"), correctOptionIds: ["1"] }),
  make({ id: "q-003", type: "multi", prompt: "Chọn TẤT CẢ các loại quả.", grade: 3, unit: 4, options: opts("apple", "carrot", "banana", "potato"), correctOptionIds: ["1", "3"], points: 2 }),
  make({ id: "q-004", type: "truefalse", prompt: "\"Monday\" comes after \"Sunday\".", grade: 3, unit: 5, trueFalseAnswer: true }),
  make({ id: "q-005", type: "fillblank", prompt: "My name ___ Lan.", grade: 3, unit: 1, skill: "grammar", acceptedAnswers: ["is"] }),
  make({ id: "q-006", type: "fillblank", prompt: "There are ___ days in a week.", grade: 4, unit: 6, difficulty: 2, acceptedAnswers: ["seven", "7"] }),
  make({ id: "q-007", type: "matching", prompt: "Nối từ với nghĩa tiếng Việt.", grade: 1, unit: 2, points: 3, pairs: [
    { id: "p1", left: "dog", right: "con chó" },
    { id: "p2", left: "cat", right: "con mèo" },
    { id: "p3", left: "bird", right: "con chim" },
  ] }),
  make({ id: "q-008", type: "ordering", prompt: "Sắp xếp các từ thành câu đúng.", grade: 4, unit: 2, skill: "grammar", difficulty: 2, sentence: "I like to play football" }),
  make({ id: "q-009", type: "essay", prompt: "Viết 3 câu giới thiệu về gia đình em.", grade: 6, unit: 1, skill: "writing", difficulty: 2, points: 3, sampleAnswer: "There are four people in my family. My father is a teacher. My mother is a nurse." }),
  make({ id: "q-010", type: "mcq", prompt: "Read: \"Tom has a red ball.\" What colour is Tom's ball?", grade: 3, unit: 6, skill: "reading", options: opts("red", "blue", "green", "yellow"), correctOptionIds: ["1"] }),
  make({ id: "q-011", type: "mcq", prompt: "If I ___ rich, I would travel the world.", grade: 9, unit: 4, skill: "grammar", difficulty: 3, options: opts("were", "am", "was", "be"), correctOptionIds: ["1"], explanation: "Câu điều kiện loại 2 dùng \"were\" cho mọi chủ ngữ." }),
  make({ id: "q-012", type: "truefalse", prompt: "\"Children\" is the plural of \"child\".", grade: 6, unit: 2, skill: "grammar", status: "archived", trueFalseAnswer: true }),
];

// Giữ chữ ký async để sau này thay bằng gọi API thật.
export async function getQuestions(): Promise<Question[]> {
  return questions;
}

export async function getQuestionById(id: string): Promise<Question | undefined> {
  return questions.find((q) => q.id === id);
}
