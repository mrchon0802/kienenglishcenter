"use server";

import { revalidatePath } from "next/cache";
import { assignCurriculumToClass } from "@/mocks/class-curriculum";

export async function assignClassCurriculumAction(formData: FormData) {
  const classId = String(formData.get("classId") ?? "");
  const curriculumId = String(formData.get("curriculumId") ?? "");
  if (!classId || !curriculumId) return;
  const result = await assignCurriculumToClass(classId, curriculumId);
  if (!result.ok) throw new Error(result.error);
  revalidatePath("/admin/teaching-progress");
  revalidatePath(`/teacher/classes/${classId}`);
}
