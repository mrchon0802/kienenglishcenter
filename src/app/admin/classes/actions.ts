"use server";

import { findScheduleConflict, validateClassInput, type ClassInput } from "@/lib/class-validation";
import { formatSchedule } from "@/lib/schedule";
import { revalidateEverything } from "@/lib/revalidate";
import { createClass, getClassById, getClasses, updateClass } from "@/mocks/classes";

type Response = { ok: true; id: string } | { ok: false; error: string };

function firstError(errors: Record<string, string | undefined>): string {
  return Object.values(errors).find(Boolean) ?? "Dữ liệu không hợp lệ.";
}

async function checkConflict(input: ClassInput, ignoreId?: string): Promise<string | null> {
  const conflict = findScheduleConflict(await getClasses(), input, ignoreId);
  return conflict
    ? `Trùng giờ với lớp ${conflict.name} (${formatSchedule(conflict.scheduleDays, conflict.startTime, conflict.endTime)}). Trung tâm chỉ có 1 giáo viên nên hai lớp không được học cùng giờ.`
    : null;
}

/** TODO (khi có backend): gọi API POST /classes. */
export async function createClassAction(input: ClassInput): Promise<Response> {
  const errors = validateClassInput(input, "new");
  if (Object.keys(errors).length > 0) return { ok: false, error: firstError(errors) };

  const id = input.name.trim().toLowerCase();
  if (await getClassById(id)) return { ok: false, error: `Lớp ${input.name.trim().toUpperCase()} đã tồn tại.` };
  const conflict = await checkConflict(input);
  if (conflict) return { ok: false, error: conflict };

  const created = await createClass({
    name: input.name,
    grade: input.grade,
    scheduleDays: [...input.scheduleDays].sort((a, b) => a - b),
    startTime: input.startTime,
    endTime: input.endTime,
    monthlyFee: Math.round(input.monthlyFee),
    currentUnit: input.currentUnit,
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
  if (!(await getClassById(id))) return { ok: false, error: "Không tìm thấy lớp." };
  const errors = validateClassInput(input, "edit");
  if (Object.keys(errors).length > 0) return { ok: false, error: firstError(errors) };
  const conflict = await checkConflict(input, id);
  if (conflict) return { ok: false, error: conflict };

  await updateClass(id, {
    grade: input.grade,
    scheduleDays: [...input.scheduleDays].sort((a, b) => a - b),
    startTime: input.startTime,
    endTime: input.endTime,
    monthlyFee: Math.round(input.monthlyFee),
    currentUnit: input.currentUnit,
  });
  revalidateEverything();
  return { ok: true, id };
}
