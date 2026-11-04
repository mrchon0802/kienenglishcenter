"use server";

import { toISODate } from "@/lib/month";
import { revalidateEverything } from "@/lib/revalidate";
import { validateQuestion } from "@/lib/question-types";
import { addQuestions, getQuestionById, setQuestionStatus, updateQuestion } from "@/mocks/questions";
import type { Question } from "@/types/question";

type Fail = { ok: false; error: string };

function checkQuestion(q: Question): string | null {
  const errors = validateQuestion(q);
  const first = Object.values(errors).find(Boolean);
  if (first) return first;
  if (!Number.isInteger(q.grade) || q.grade < 1 || q.grade > 9) return "Lớp phải từ 1 đến 9.";
  return null;
}

/** Tạo câu hỏi mới. TODO (khi có backend): gọi API POST /questions. */
export async function createQuestionAction(question: Question): Promise<{ ok: true; id: string } | Fail> {
  const error = checkQuestion(question);
  if (error) return { ok: false, error };
  const [created] = await addQuestions([question], toISODate(new Date()));
  revalidateEverything();
  return { ok: true, id: created.id };
}

/** Sửa câu hỏi (không đổi dạng câu). Bài đã giao giữ bản sao cũ nên không bị ảnh hưởng. */
export async function updateQuestionAction(id: string, question: Question): Promise<{ ok: true } | Fail> {
  if (!(await getQuestionById(id))) return { ok: false, error: "Không tìm thấy câu hỏi." };
  const error = checkQuestion(question);
  if (error) return { ok: false, error };
  await updateQuestion(id, question);
  revalidateEverything();
  return { ok: true };
}

export async function setQuestionStatusAction(id: string, status: "active" | "archived"): Promise<{ ok: true } | Fail> {
  if (status !== "active" && status !== "archived") return { ok: false, error: "Trạng thái không hợp lệ." };
  if (!(await setQuestionStatus(id, status))) return { ok: false, error: "Không tìm thấy câu hỏi." };
  revalidateEverything();
  return { ok: true };
}

export interface QuestionImportResult {
  created: number;
  skipped: { row: number; reason: string }[];
}

/** Nhập nhiều câu hỏi từ Excel: kiểm tra lại từng câu ở server, câu lỗi bị bỏ qua và báo lý do. */
export async function importQuestionsAction(
  rows: { rowNumber: number; question: Question }[],
): Promise<({ ok: true } & QuestionImportResult) | Fail> {
  if (rows.length === 0) return { ok: false, error: "Không có câu hỏi nào để nhập." };
  if (rows.length > 500) return { ok: false, error: "Mỗi lần nhập tối đa 500 câu hỏi." };

  const valid: Question[] = [];
  const skipped: QuestionImportResult["skipped"] = [];
  for (const { rowNumber, question } of rows) {
    const error = checkQuestion(question);
    if (error) skipped.push({ row: rowNumber, reason: error });
    else valid.push(question);
  }
  if (valid.length > 0) await addQuestions(valid, toISODate(new Date()));
  revalidateEverything();
  return { ok: true, created: valid.length, skipped };
}
