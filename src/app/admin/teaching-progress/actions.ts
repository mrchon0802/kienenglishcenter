"use server";

import { requireAdminAction } from "@/lib/action-auth";

import { revalidatePath } from "next/cache";
import { assignCurriculumToClass } from "@/mocks/class-curriculum";

export async function assignClassCurriculumAction(formData: FormData) {
  await requireAdminAction();

  const classId = String(formData.get("classId") ?? "");
  const curriculumId = String(formData.get("curriculumId") ?? "");
  if (!classId || !curriculumId) return;
  const result = await assignCurriculumToClass(classId, curriculumId);
  if (!result.ok) throw new Error(result.error);
  revalidatePath("/admin/teaching-progress");
  revalidatePath(`/teacher/classes/${classId}`);
}
