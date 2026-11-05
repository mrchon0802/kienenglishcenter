"use server";

import { revalidatePath } from "next/cache";
import { createCurriculum, deleteCurriculum, getCurricula, updateCurriculum } from "@/mocks/curricula";
import { getCourses } from "@/mocks/courses";
import type { CurriculumInput } from "@/types/curriculum";

type Result = { ok: true; id: string } | { ok: false; error: string };

function validate(input: CurriculumInput): string | null {
  if (!input.code.trim()) return "Vui lòng nhập mã giáo trình.";
  if (!/^[A-Za-z0-9-]{2,24}$/.test(input.code.trim())) return "Mã giáo trình chỉ gồm chữ, số hoặc dấu gạch ngang (2–24 ký tự).";
  if (!input.title.trim()) return "Vui lòng nhập tên giáo trình.";
  if (input.targetType === "grade" && (!Number.isInteger(input.grade) || (input.grade ?? 0) < 1 || (input.grade ?? 0) > 9)) return "Vui lòng chọn khối lớp từ 1 đến 9.";
  if (input.targetType === "course" && !input.courseId) return "Vui lòng chọn khóa học.";
  if (!input.units.length) return "Giáo trình cần có ít nhất một Unit.";
  if (input.units.some((unit) => !unit.title.trim() || !unit.lessons.length)) return "Mỗi Unit cần có tên và ít nhất một Lesson.";
  if (input.units.some((unit) => unit.lessons.some((lesson) => !lesson.title.trim() || !Number.isInteger(lesson.durationMinutes) || lesson.durationMinutes < 1 || lesson.durationMinutes > 600))) return "Mỗi Lesson cần tên và thời lượng từ 1 đến 600 phút.";
  if (input.targetType === "course") return null;
  return null;
}

export async function saveCurriculumAction(input: CurriculumInput, id?: string): Promise<Result> {
  const error = validate(input);
  if (error) return { ok: false, error };
  const all = await getCurricula();
  if (all.some((item) => item.code.toLowerCase() === input.code.trim().toLowerCase() && item.id !== id)) {
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
    const updated = await updateCurriculum(id, normalized);
    if (!updated) return { ok: false, error: "Không tìm thấy giáo trình." };
    revalidatePath("/admin/curriculum");
    revalidatePath(`/admin/curriculum/${id}/edit`);
    return { ok: true, id };
  }
  const created = await createCurriculum(normalized);
  revalidatePath("/admin/curriculum");
  return { ok: true, id: created.id };
}

export async function deleteCurriculumAction(id: string): Promise<Result> {
  const deleted = await deleteCurriculum(id);
  if (!deleted) return { ok: false, error: "Không tìm thấy giáo trình." };
  revalidatePath("/admin/curriculum");
  return { ok: true, id };
}
