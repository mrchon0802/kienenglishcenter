"use server";
import { revalidatePath } from "next/cache";
import { DEMO_CENTER_USER } from "@/mocks/teacher-session";
import { saveTeacherSessionCompletion } from "@/mocks/teacher-session-completions";
import type { TeacherSessionCompletionInput } from "@/types/teacher-session-completion";

export async function saveSessionCompletionAction(input: TeacherSessionCompletionInput) {
  const result = await saveTeacherSessionCompletion(DEMO_CENTER_USER.teacherId, input);
  if (result.ok) {
    revalidatePath(`/teacher/classes/${input.classId}/attendance`);
    revalidatePath(`/teacher/classes/${input.classId}/sessions/${input.sessionId}/complete`);
    revalidatePath("/teacher/reports");
  }
  return result;
}
