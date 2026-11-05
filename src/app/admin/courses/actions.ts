"use server";

import { revalidatePath } from "next/cache";
import { createCourse, deleteCourse, getCourseById, getCourses, updateCourse } from "@/mocks/courses";
import type { CourseInput } from "@/types/course";

type Result = { ok: true; id: string } | { ok: false; error: string };

function validate(input: CourseInput): string | null {
  if (!input.code.trim()) return "Vui lòng nhập mã khóa học.";
  if (!/^[A-Za-z0-9-]{2,16}$/.test(input.code.trim())) return "Mã khóa học chỉ gồm chữ, số hoặc dấu gạch ngang (2–16 ký tự).";
  if (!input.name.trim()) return "Vui lòng nhập tên khóa học.";
  if (!Number.isInteger(input.durationWeeks) || input.durationWeeks < 1 || input.durationWeeks > 104) return "Thời lượng phải từ 1 đến 104 tuần.";
  if (!Number.isInteger(input.totalSessions) || input.totalSessions < 1 || input.totalSessions > 500) return "Số buổi phải từ 1 đến 500.";
  if (!Number.isFinite(input.standardFee) || input.standardFee < 0 || input.standardFee > 100000000) return "Học phí không hợp lệ.";
  if (input.units.some((unit) => !unit.title.trim() || !Number.isInteger(unit.lessons) || unit.lessons < 1)) return "Mỗi Unit cần tên và số bài học hợp lệ.";
  return null;
}

export async function saveCourseAction(input: CourseInput, id?: string): Promise<Result> {
  const error = validate(input);
  if (error) return { ok: false, error };
  const courses = await getCourses();
  const duplicateCode = courses.some((course) => course.code.toLowerCase() === input.code.trim().toLowerCase() && course.id !== id);
  if (duplicateCode) return { ok: false, error: "Mã khóa học đã tồn tại." };

  if (id) {
    const updated = await updateCourse(id, input);
    if (!updated) return { ok: false, error: "Không tìm thấy khóa học." };
    revalidatePath("/admin/courses");
    revalidatePath(`/admin/courses/${id}`);
    revalidatePath("/admin/classes");
    return { ok: true, id };
  }
  const created = await createCourse(input);
  revalidatePath("/admin/courses");
  return { ok: true, id: created.id };
}

export async function deleteCourseAction(id: string): Promise<Result> {
  const course = await getCourseById(id);
  if (!course) return { ok: false, error: "Không tìm thấy khóa học." };
  const deleted = await deleteCourse(id);
  if (!deleted) return { ok: false, error: "Không thể xóa khóa học đang được gắn với một hoặc nhiều lớp." };
  revalidatePath("/admin/courses");
  return { ok: true, id };
}
