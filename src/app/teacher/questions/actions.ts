"use server";

import { requireTeacherAction } from "@/lib/action-auth";

import { revalidatePath } from "next/cache";
import { getCurrentTeacherId } from "@/lib/current-user";
import { addQuestions, copyQuestion, getQuestionById, getTeacherQuestionById, setQuestionStatus, updateQuestion } from "@/mocks/questions";
import { validateQuestion } from "@/lib/question-types";
import { toISODate } from "@/lib/month";
import type { Question } from "@/types/question";

function validate(q: Question): string | null {
  const errors = validateQuestion(q);
  const first = Object.values(errors).find(Boolean);
  if (first) return first;
  if (!q.curriculumId || !q.unitId || !q.lessonId) return "Vui lòng chọn chương trình, Unit và Lesson.";
  return null;
}

export async function createTeacherQuestionAction(question: Question) {
  await requireTeacherAction();

  const currentTeacherId = await getCurrentTeacherId();

  const error = validate(question);
  if (error) return { ok: false as const, error };
  const [created] = await addQuestions([{ ...question, createdBy: currentTeacherId, sharedWithTeacherIds: [] }], toISODate(new Date()));
  revalidatePath("/teacher/questions");
  revalidatePath("/admin/question-bank");
  return { ok: true as const, id: created.id };
}

export async function updateTeacherQuestionAction(id: string, question: Question) {
  await requireTeacherAction();

  const currentTeacherId = await getCurrentTeacherId();

  const current = await getTeacherQuestionById(id, currentTeacherId);
  if (!current || current.createdBy !== currentTeacherId) return { ok: false as const, error: "Bạn chỉ được sửa câu hỏi do mình tạo." };
  const error = validate(question);
  if (error) return { ok: false as const, error };
  await updateQuestion(id, question);
  revalidatePath("/teacher/questions");
  revalidatePath("/admin/question-bank");
  return { ok: true as const };
}

export async function copyTeacherQuestionAction(id: string) {
  await requireTeacherAction();

  const currentTeacherId = await getCurrentTeacherId();

  const copied = await copyQuestion(id, currentTeacherId);
  if (!copied) return { ok: false as const, error: "Bạn không có quyền sử dụng câu hỏi này." };
  revalidatePath("/teacher/questions");
  return { ok: true as const, id: copied.id };
}
