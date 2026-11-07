"use server";

import { requireTeacherAction } from "@/lib/action-auth";

import { revalidatePath } from "next/cache";
import { getCurrentTeacherId } from "@/lib/current-user";
import type { TeacherLessonPlanInput } from "@/types/teacher-lesson-plan";
import { saveTeacherLessonPlan, copyTeacherLessonPlan } from "@/mocks/teacher-lesson-plans";

export async function saveTeacherLessonPlanAction(input: TeacherLessonPlanInput, planId?: string) {
  await requireTeacherAction();

  const currentTeacherId = await getCurrentTeacherId();

  const result = await saveTeacherLessonPlan(currentTeacherId, input, planId);
  if (result.ok) {
    revalidatePath("/teacher/lesson-plans");
    revalidatePath(`/teacher/lesson-plans/${result.id}`);
  }
  return result;
}

export async function copyTeacherLessonPlanAction(planId: string) {
  await requireTeacherAction();

  const currentTeacherId = await getCurrentTeacherId();

 const result = await copyTeacherLessonPlan(planId, currentTeacherId);
 if (result.ok) { revalidatePath("/teacher/lesson-plans"); revalidatePath(`/teacher/lesson-plans/${result.id}`); }
 return result;
}
