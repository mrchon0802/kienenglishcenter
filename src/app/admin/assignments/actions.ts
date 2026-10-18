"use server";

import { revalidatePath } from "next/cache";
import { createAssignment } from "@/mocks/assignments";
import { getClasses } from "@/mocks/classes";
import { getQuestionById } from "@/mocks/questions";
import type { NewAssignmentInput } from "@/types/assignment";

type CreateResponse = { ok: true; id: string } | { ok: false; error: string };

/**
 * Tạo bài tập: câu hỏi được SAO CHÉP vào bài tại thời điểm này (snapshot), nên sửa ngân hàng sau đó
 * không làm đổi bài đã giao. Hiện lưu trong bộ nhớ server (mất khi khởi động lại).
 * TODO (khi có backend): gọi API POST /assignments.
 */
export async function createAssignmentAction(input: NewAssignmentInput): Promise<CreateResponse> {
  if (!input.title.trim()) return { ok: false, error: "Nhập tên bài." };
  if (input.kind !== "practice" && input.kind !== "test") return { ok: false, error: "Loại bài không hợp lệ." };

  const classes = await getClasses();
  if (!classes.some((c) => c.id === input.classId)) return { ok: false, error: "Lớp không tồn tại." };

  if (!input.dueAt || Number.isNaN(new Date(input.dueAt).getTime())) {
    return { ok: false, error: "Hạn nộp không hợp lệ." };
  }
  if (input.kind === "test" && !(input.durationMinutes && input.durationMinutes > 0)) {
    return { ok: false, error: "Bài kiểm tra cần có thời gian làm bài." };
  }

  const ids = [...new Set(input.questionIds)];
  if (ids.length === 0) return { ok: false, error: "Chọn ít nhất 1 câu hỏi." };
  for (const id of ids) {
    const q = await getQuestionById(id);
    if (!q || q.status !== "active") return { ok: false, error: `Câu hỏi ${id} không tồn tại hoặc đã lưu trữ.` };
  }

  const assignment = await createAssignment({ ...input, questionIds: ids });
  revalidatePath("/admin/assignments");
  revalidatePath("/student");
  revalidatePath("/student/assignments");
  return { ok: true, id: assignment.id };
}
