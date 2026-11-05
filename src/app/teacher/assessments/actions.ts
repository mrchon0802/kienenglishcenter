"use server";

import { revalidatePath } from "next/cache";
import { DEMO_CENTER_USER } from "@/mocks/teacher-session";
import { createStudentAssessment } from "@/mocks/student-assessments";
import type { StudentAssessmentInput } from "@/types/student-assessment";

export async function createStudentAssessmentAction(input: StudentAssessmentInput) {
  const result = await createStudentAssessment(DEMO_CENTER_USER.teacherId, input);
  if (!result.ok) return result;
  revalidatePath("/teacher/assessments");
  revalidatePath("/admin/assessments");
  revalidatePath("/admin/reports");
  return result;
}
