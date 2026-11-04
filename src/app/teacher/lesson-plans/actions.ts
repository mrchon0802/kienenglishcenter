"use server";

import { revalidatePath } from "next/cache";
import { DEMO_CENTER_USER } from "@/mocks/teacher-session";
import type { TeacherLessonPlanInput } from "@/types/teacher-lesson-plan";
import { saveTeacherLessonPlan } from "@/mocks/teacher-lesson-plans";

export async function saveTeacherLessonPlanAction(input: TeacherLessonPlanInput, planId?: string) {
  const result = await saveTeacherLessonPlan(DEMO_CENTER_USER.teacherId, input, planId);
  if (result.ok) {
    revalidatePath("/teacher/lesson-plans");
    revalidatePath(`/teacher/lesson-plans/${result.id}`);
  }
  return result;
}
