"use server";

import { requireTeacherAction } from "@/lib/action-auth";

import { revalidatePath } from "next/cache";
import { getCurrentTeacherId } from "@/lib/current-user";
import { createStudentAssessment } from "@/mocks/student-assessments";
import type { StudentAssessmentInput } from "@/types/student-assessment";

export async function createStudentAssessmentAction(input: StudentAssessmentInput) {
  await requireTeacherAction();

  const currentTeacherId = await getCurrentTeacherId();

  const result = await createStudentAssessment(currentTeacherId, input);
  if (!result.ok) return result;
  revalidatePath("/teacher/assessments");
  revalidatePath("/admin/assessments");
  revalidatePath("/admin/reports");
  return result;
}
