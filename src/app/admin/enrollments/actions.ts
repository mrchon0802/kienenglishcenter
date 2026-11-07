"use server";

import { requireAdminAction } from "@/lib/action-auth";

import { revalidatePath } from "next/cache";
import { createCourseEnrollment, updateCourseEnrollmentStatus } from "@/mocks/course-enrollments";
import { getClasses } from "@/mocks/classes";
import { getCourses } from "@/mocks/courses";
import { getStudents } from "@/mocks/students";
import type { CourseEnrollmentInput, CourseEnrollmentStatus } from "@/types/course-enrollment";

type Result = { ok: true } | { ok: false; error: string };

export async function createCourseEnrollmentAction(input: CourseEnrollmentInput): Promise<Result> {
  await requireAdminAction();

  if (!input.studentId || !input.courseId || !input.classId) return { ok: false, error: "Vui lòng chọn học sinh, khóa học và lớp học." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.enrolledAt)) return { ok: false, error: "Ngày đăng ký không hợp lệ." };
  if (!Number.isFinite(input.fee) || input.fee < 0 || input.fee > 100_000_000) return { ok: false, error: "Học phí không hợp lệ." };

  const [students, courses, classes] = await Promise.all([getStudents(), getCourses(), getClasses()]);
  if (!students.some((student) => student.id === input.studentId && student.status === "active")) return { ok: false, error: "Học sinh không tồn tại hoặc đã ngừng học." };
  if (!courses.some((course) => course.id === input.courseId && course.status === "active")) return { ok: false, error: "Khóa học không tồn tại hoặc đã ngừng hoạt động." };
  if (!classes.some((cls) => cls.id === input.classId && cls.courseId === input.courseId)) return { ok: false, error: "Lớp đã chọn không thuộc khóa học này." };

  const created = await createCourseEnrollment(input);
  if (!created) return { ok: false, error: "Học sinh đã đăng ký lớp này hoặc dữ liệu không hợp lệ." };
  revalidatePath("/admin/enrollments");
  revalidatePath("/admin/courses");
  revalidatePath("/admin/classes");
  return { ok: true };
}

export async function updateCourseEnrollmentStatusAction(id: string, status: CourseEnrollmentStatus): Promise<Result> {
  await requireAdminAction();

  const allowed: CourseEnrollmentStatus[] = ["active", "completed", "paused", "cancelled"];
  if (!id || !allowed.includes(status)) return { ok: false, error: "Trạng thái đăng ký không hợp lệ." };
  const updated = await updateCourseEnrollmentStatus(id, status);
  if (!updated) return { ok: false, error: status === "active" ? "Học sinh đã có một đăng ký đang học trong lớp này." : "Không tìm thấy đăng ký khóa học." };
  revalidatePath("/admin/enrollments");
  revalidatePath("/admin/courses");
  return { ok: true };
}
