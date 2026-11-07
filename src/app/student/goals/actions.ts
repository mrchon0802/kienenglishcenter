"use server";

import { requireStudentAction } from "@/lib/action-auth";

import { revalidatePath } from "next/cache";
import { getCurrentStudentId } from "@/lib/current-user";
import { createStudentLearningGoal, updateStudentLearningGoal } from "@/mocks/student-learning";

export async function createLearningGoalAction(formData: FormData): Promise<void> {
  await requireStudentAction();

  const currentStudentId = await getCurrentStudentId();

  const result = await createStudentLearningGoal({
    studentId: currentStudentId,
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
  await requireStudentAction();

  const currentStudentId = await getCurrentStudentId();

  const result = await updateStudentLearningGoal(
    currentStudentId,
    String(formData.get("goalId") ?? ""),
    Number(formData.get("progress")),
  );
  if (!result.ok) throw new Error(result.error);
  revalidatePath("/student/goals");
  revalidatePath("/student");
}
