"use server";

import { requireAdminAction } from "@/lib/action-auth";

import { validateClassInput, type ClassInput } from "@/lib/class-validation";
import { revalidateEverything } from "@/lib/revalidate";
import { createClass, getClassById, getClasses, updateClass } from "@/mocks/classes";

type Response = { ok: true; id: string } | { ok: false; error: string };

function firstError(errors: Record<string, string | undefined>): string {
  return Object.values(errors).find(Boolean) ?? "Dữ liệu không hợp lệ.";
}


/** TODO (khi có backend): gọi API POST /classes. */
export async function createClassAction(input: ClassInput): Promise<Response> {
  await requireAdminAction();

  const errors = validateClassInput(input, "new");
  if (Object.keys(errors).length > 0) return { ok: false, error: firstError(errors) };

  const id = input.name.trim().toLowerCase();
  if (await getClassById(id)) return { ok: false, error: `Lớp ${input.name.trim().toUpperCase()} đã tồn tại.` };
  const created = await createClass({
    name: input.name,
    grade: input.grade,
    scheduleDays: input.scheduleSlots.map((slot) => slot.day).sort((a, b) => a - b),
    scheduleSlots: input.scheduleSlots.map((slot) => ({ ...slot })).sort((a, b) => a.day - b.day),
    startTime: [...input.scheduleSlots].sort((a, b) => a.day - b.day)[0].startTime,
    endTime: [...input.scheduleSlots].sort((a, b) => a.day - b.day)[0].endTime,
    monthlyFee: Math.round(input.monthlyFee),
    currentUnit: input.currentUnit,
    courseId: input.courseId || undefined,
  });
  revalidateEverything();
  return { ok: true, id: created.id };
}

/**
 * Sửa lớp (không đổi được tên lớp). Đổi học phí chỉ áp dụng cho hóa đơn tạo SAU đó,
 * hóa đơn đã tạo giữ nguyên số tiền cũ.
 * TODO (khi có backend): gọi API PATCH /classes/:id.
 */
export async function updateClassAction(id: string, input: ClassInput): Promise<Response> {
  await requireAdminAction();

  if (!(await getClassById(id))) return { ok: false, error: "Không tìm thấy lớp." };
  const errors = validateClassInput(input, "edit");
  if (Object.keys(errors).length > 0) return { ok: false, error: firstError(errors) };
  await updateClass(id, {
    grade: input.grade,
    scheduleDays: input.scheduleSlots.map((slot) => slot.day).sort((a, b) => a - b),
    scheduleSlots: input.scheduleSlots.map((slot) => ({ ...slot })).sort((a, b) => a.day - b.day),
    startTime: [...input.scheduleSlots].sort((a, b) => a.day - b.day)[0].startTime,
    endTime: [...input.scheduleSlots].sort((a, b) => a.day - b.day)[0].endTime,
    monthlyFee: Math.round(input.monthlyFee),
    currentUnit: input.currentUnit,
    courseId: input.courseId || undefined,
  });
  revalidateEverything();
  return { ok: true, id };
}
