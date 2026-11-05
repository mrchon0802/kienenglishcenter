"use server";

import { revalidatePath } from "next/cache";
import { CURRENT_STUDENT_ID } from "@/mocks/session";
import { markStudentNotificationRead } from "@/mocks/student-notifications";

export async function markNotificationReadAction(id: string): Promise<void> {
  if (!id || id.length > 100) return;
  await markStudentNotificationRead(id, CURRENT_STUDENT_ID);
  revalidatePath("/student/notifications");
}
