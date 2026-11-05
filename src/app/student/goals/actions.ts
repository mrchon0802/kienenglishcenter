"use server";

import { revalidatePath } from "next/cache";
import { CURRENT_STUDENT_ID } from "@/mocks/session";
import { createStudentLearningGoal, updateStudentLearningGoal } from "@/mocks/student-learning";

export async function createLearningGoalAction(formData: FormData): Promise<void> {
  const result = await createStudentLearningGoal({
    studentId: CURRENT_STUDENT_ID,
    title: String(formData.get("title") ?? ""),
    targetDate: String(formData.get("targetDate") ?? ""),
    target: Number(formData.get("target")),
    unit: String(formData.get("unit") ?? ""),
  });
  if (!result.ok) throw new Error(result.error);
  revalidatePath("/student/goals");
  revalidatePath("/student");
}

export async function updateLearningGoalAction(formData: FormData): Promise<void> {
  const result = await updateStudentLearningGoal(
    CURRENT_STUDENT_ID,
    String(formData.get("goalId") ?? ""),
    Number(formData.get("progress")),
  );
  if (!result.ok) throw new Error(result.error);
  revalidatePath("/student/goals");
  revalidatePath("/student");
}
