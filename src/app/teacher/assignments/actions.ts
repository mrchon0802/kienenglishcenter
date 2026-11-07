"use server";

import { requireTeacherAction } from "@/lib/action-auth";

import { revalidatePath } from "next/cache";
import { getCurrentTeacherId } from "@/lib/current-user";
import { getTeacherPortalData } from "@/mocks/teacher-portal";
import { addQuestions } from "@/mocks/questions";
import { getCurriculumById } from "@/mocks/curricula";
import { createAssignment } from "@/mocks/assignments";
import { validateQuestion } from "@/lib/question-types";
import type { NewAssignmentInput } from "@/types/assignment";
import type { Question } from "@/types/question";

export interface TeacherAssignmentPayload {
  title: string;
  kind: "practice" | "test";
  classId: string;
  dueAt: string;
  durationMinutes: number | null;
  showAnswers: "immediately" | "after_deadline" | "never";
  questionIds: string[];
  curriculumId: string;
  unitId: string;
  lessonId: string;
  newQuestions: Question[];
}

export async function publishTeacherAssignment(payload: TeacherAssignmentPayload) {
  await requireTeacherAction();

  const currentTeacherId = await getCurrentTeacherId();

  const title = payload.title.trim();
  if (!title) return { ok: false as const, error: "Vui lòng nhập tên bài tập/kiểm tra." };
  if (!payload.dueAt || Number.isNaN(new Date(payload.dueAt).getTime())) return { ok: false as const, error: "Thời hạn nộp không hợp lệ." };
  if (payload.kind === "test" && (!payload.durationMinutes || payload.durationMinutes < 1 || payload.durationMinutes > 300)) {
    return { ok: false as const, error: "Thời gian làm bài kiểm tra phải từ 1 đến 300 phút." };
  }

  if (!payload.curriculumId || !payload.unitId || !payload.lessonId) return { ok: false as const, error: "Hãy chọn chương trình, Unit và Lesson." };
  const curriculum = await getCurriculumById(payload.curriculumId);
  const unit = curriculum?.units.find((item) => item.id === payload.unitId);
  if (!unit?.lessons.some((item) => item.id === payload.lessonId)) return { ok: false as const, error: "Unit hoặc Lesson không thuộc chương trình đã chọn." };

  const portal = await getTeacherPortalData(currentTeacherId);
  const assignedClass = portal?.classes.find((item) => item.id === payload.classId);
  if (!assignedClass) return { ok: false as const, error: "Bạn không được phân công lớp này." };

  for (const question of payload.newQuestions) {
    const errors = validateQuestion(question);
    if (Object.keys(errors).length) return { ok: false as const, error: `Câu hỏi “${question.prompt || "chưa đặt nội dung"}” chưa hợp lệ: ${Object.values(errors)[0]}` };
  }
  if (!payload.questionIds.length && !payload.newQuestions.length) return { ok: false as const, error: "Hãy chọn hoặc tạo ít nhất một câu hỏi." };

  const today = new Date().toISOString().slice(0, 10);
  const createdQuestions = payload.newQuestions.length ? await addQuestions(payload.newQuestions, today) : [];
  const input: NewAssignmentInput = {
    title,
    kind: payload.kind,
    classId: payload.classId,
    curriculumId: payload.curriculumId,
    unitId: payload.unitId,
    lessonId: payload.lessonId,
    dueAt: payload.dueAt,
    durationMinutes: payload.kind === "test" ? payload.durationMinutes : null,
    showAnswers: payload.showAnswers,
    questionIds: [...payload.questionIds, ...createdQuestions.map((question) => question.id)],
  };
  const assignment = await createAssignment(input);
  if (assignment.questions.length !== input.questionIds.length) {
    return { ok: false as const, error: "Một số câu hỏi không còn tồn tại. Vui lòng tải lại trang và thử lại." };
  }
  revalidatePath("/teacher/assignments");
  revalidatePath("/student/assignments");
  revalidatePath("/admin/assignments");
  return { ok: true as const, assignmentId: assignment.id, questionCount: assignment.questions.length };
}
