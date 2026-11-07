"use server";

import { requireAdminAction } from "@/lib/action-auth";

import { revalidatePath } from "next/cache";
import { createCurriculum, createCurriculumVersion, deleteCurriculum, getCurricula } from "@/mocks/curricula";
import { getCourses } from "@/mocks/courses";
import { getClassCurriculumAssignments } from "@/mocks/class-curriculum";
import { getAssignments } from "@/mocks/assignments";
import { getQuestions } from "@/mocks/questions";
import { getAllTeacherLessonPlans } from "@/mocks/teacher-lesson-plans";
import type { CurriculumInput } from "@/types/curriculum";

type Result = { ok: true; id: string } | { ok: false; error: string };

function validate(input: CurriculumInput): string | null {
  if (!input.code.trim()) return "Vui lòng nhập mã giáo trình.";
  if (!/^[A-Za-z0-9-]{2,24}$/.test(input.code.trim())) return "Mã giáo trình chỉ gồm chữ, số hoặc dấu gạch ngang (2–24 ký tự).";
  if (!input.title.trim()) return "Vui lòng nhập tên giáo trình.";
  if (input.targetType === "grade" && (!Number.isInteger(input.grade) || (input.grade ?? 0) < 1 || (input.grade ?? 0) > 9)) return "Vui lòng chọn khối lớp từ 1 đến 9.";
  if (input.targetType === "course" && !input.courseId) return "Vui lòng chọn khóa học.";
  if (input.units.some((unit) => !unit.title.trim())) return "Mỗi Unit cần có tên.";
  if (input.units.some((unit) => unit.lessons.some((lesson) => !lesson.title.trim() || !Number.isInteger(lesson.durationMinutes) || lesson.durationMinutes < 1 || lesson.durationMinutes > 600))) return "Mỗi Lesson cần tên và thời lượng từ 1 đến 600 phút.";
  if (input.targetType === "course") return null;
  return null;
}

export async function saveCurriculumAction(input: CurriculumInput, id?: string): Promise<Result> {
  await requireAdminAction();

  const error = validate(input);
  if (error) return { ok: false, error };
  const all = await getCurricula();
  if (!id && all.some((item) => item.code.toLowerCase() === input.code.trim().toLowerCase())) {
    return { ok: false, error: "Mã giáo trình đã tồn tại." };
  }
  if (input.targetType === "course") {
    const courses = await getCourses();
    if (!courses.some((course) => course.id === input.courseId)) return { ok: false, error: "Khóa học được chọn không tồn tại." };
  }
  const normalized: CurriculumInput = input.targetType === "grade"
    ? { ...input, grade: input.grade, courseId: null }
    : { ...input, grade: null };
  if (id) {
    const previous = all.find((item) => item.id === id);
    if (!previous) return { ok: false, error: "Không tìm thấy giáo trình." };
    if (previous.status !== "active") return { ok: false, error: "Chỉ có thể tạo phiên bản mới từ giáo trình đang sử dụng." };
    const created = await createCurriculumVersion(id, normalized);
    if (!created) return { ok: false, error: "Không thể tạo phiên bản mới." };
    revalidatePath("/admin/curriculum");
    revalidatePath(`/admin/curriculum/${id}`);
    revalidatePath(`/admin/curriculum/${id}/edit`);
    revalidatePath("/admin/teaching-progress");
    return { ok: true, id: created.id };
  }
  const created = await createCurriculum(normalized);
  revalidatePath("/admin/curriculum");
  return { ok: true, id: created.id };
}

export async function initializeGradeCurriculaAction(): Promise<{ ok: true; created: number } | { ok: false; error: string }> {
  await requireAdminAction();

  const existing = await getCurricula();
  const existingGrades = new Set(existing.filter((item) => item.targetType === "grade").map((item) => item.grade));
  let created = 0;

  for (let grade = 1; grade <= 9; grade += 1) {
    if (existingGrades.has(grade)) continue;
    await createCurriculum({
      code: `GRADE-${String(grade).padStart(2, "0")}`,
      title: `Chương trình tiếng Anh lớp ${grade}`,
      description: `Khung chương trình chuẩn dành cho học sinh lớp ${grade}. Admin có thể bổ sung Unit và Lesson theo giáo trình thực tế của trung tâm.`,
      targetType: "grade",
      grade,
      courseId: null,
      status: "active",
      units: [],
    });
    created += 1;
  }

  revalidatePath("/admin/curriculum");
  return { ok: true, created };
}

export async function deleteCurriculumAction(id: string): Promise<Result> {
  await requireAdminAction();

  const [links, assignments, questions, plans] = await Promise.all([
    getClassCurriculumAssignments(), getAssignments(), getQuestions(), getAllTeacherLessonPlans(),
  ]);
  const usedByClass = links.some((item) => item.curriculumId === id);
  const usedByAssignment = assignments.some((item) => item.curriculumId === id);
  const usedByQuestion = questions.some((item) => item.curriculumId === id);
  const usedByPlan = plans.some((item) => item.curriculumId === id);
  const hasNextVersion = (await getCurricula()).some((item) => item.previousVersionId === id);
  if (usedByClass || usedByAssignment || usedByQuestion || usedByPlan || hasNextVersion) {
    return { ok: false, error: "Không thể xóa giáo trình đã được lớp học hoặc học liệu sử dụng. Hãy ngừng sử dụng hoặc tạo phiên bản mới để bảo toàn lịch sử." };
  }
  const deleted = await deleteCurriculum(id);
  if (!deleted) return { ok: false, error: "Không tìm thấy giáo trình." };
  revalidatePath("/admin/curriculum");
  return { ok: true, id };
}
