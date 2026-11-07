"use server";

import { requireStudentAction } from "@/lib/action-auth";

import { revalidatePath } from "next/cache";
import { getCurrentStudentId } from "@/lib/current-user";
import { markStudentNotificationRead } from "@/mocks/student-notifications";

export async function markNotificationReadAction(id: string): Promise<void> {
  await requireStudentAction();

  const currentStudentId = await getCurrentStudentId();

  if (!id || id.length > 100) return;
  await markStudentNotificationRead(id, currentStudentId);
  revalidatePath("/student/notifications");
}
