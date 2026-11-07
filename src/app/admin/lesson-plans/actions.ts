"use server";

import { requireAdminAction } from "@/lib/action-auth";

import { revalidatePath } from "next/cache";
import { shareTeacherLessonPlan } from "@/mocks/teacher-lesson-plans";

export async function shareLessonPlanAction(formData: FormData) {
  await requireAdminAction();

  const planId = String(formData.get("planId") ?? "");
  const teacherIds = formData.getAll("teacherIds").map(String);
  if (!planId) return;
  await shareTeacherLessonPlan(planId, teacherIds);
  revalidatePath("/admin/lesson-plans");
  revalidatePath("/teacher/lesson-plans");
}
