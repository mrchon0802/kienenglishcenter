"use server";

import { requireAdminAction } from "@/lib/action-auth";

import { revalidateEverything } from "@/lib/revalidate";
import { toISODate } from "@/lib/month";
import { normalizePhone, validateStudentInput, type StudentInput } from "@/lib/student-validation";
import { getClasses } from "@/mocks/classes";
import { createStudents, getStudentById, getStudents, updateStudent } from "@/mocks/students";

type Fail = { ok: false; error: string };

async function classNames(): Promise<string[]> {
  await requireAdminAction();

  return (await getClasses()).map((c) => c.name);
}

function firstError(errors: Record<string, string | undefined>): string {
  return Object.values(errors).find(Boolean) ?? "Dữ liệu không hợp lệ.";
}

/** TODO (khi có backend): gọi API POST /students. */
export async function createStudentAction(input: StudentInput): Promise<{ ok: true; id: string; code: string } | Fail> {
  await requireAdminAction();

  const errors = validateStudentInput(input, await classNames());
  if (Object.keys(errors).length > 0) return { ok: false, error: firstError(errors) };

  const [created] = await createStudents([
    {
      fullName: input.fullName.trim().replace(/\s+/g, " "),
      className: input.className,
      parentName: input.parentName.trim(),
      parentPhone: normalizePhone(input.parentPhone),
      dateOfBirth: input.dateOfBirth,
      enrolledDate: input.enrolledDate || toISODate(new Date()),
    },
  ]);
  revalidateEverything();
  return { ok: true, id: created.id, code: created.code };
}

/** TODO (khi có backend): gọi API PATCH /students/:id. */
export async function updateStudentAction(
  id: string,
  input: StudentInput & { status: "active" | "inactive" },
): Promise<{ ok: true } | Fail> {
  await requireAdminAction();

  if (!(await getStudentById(id))) return { ok: false, error: "Không tìm thấy học sinh." };
  const errors = validateStudentInput(input, await classNames());
  if (Object.keys(errors).length > 0) return { ok: false, error: firstError(errors) };
  if (input.status !== "active" && input.status !== "inactive") return { ok: false, error: "Trạng thái không hợp lệ." };

  await updateStudent(id, {
    fullName: input.fullName.trim().replace(/\s+/g, " "),
    className: input.className,
    parentName: input.parentName.trim(),
    parentPhone: normalizePhone(input.parentPhone),
    dateOfBirth: input.dateOfBirth,
    status: input.status,
  });
  revalidateEverything();
  return { ok: true };
}

/**
 * Chuyển học sinh sang lớp khác. Hóa đơn và bài nộp cũ giữ nguyên; từ giờ học sinh thuộc lớp mới
 * (nhận bài tập của lớp mới, hóa đơn tháng sau theo học phí lớp mới).
 */
export async function transferStudentAction(studentId: string, toClassName: string): Promise<{ ok: true } | Fail> {
  await requireAdminAction();

  const student = await getStudentById(studentId);
  if (!student) return { ok: false, error: "Không tìm thấy học sinh." };
  if (!(await classNames()).includes(toClassName)) return { ok: false, error: "Lớp không tồn tại." };
  if (student.className === toClassName) return { ok: false, error: "Học sinh đã ở lớp này." };

  await updateStudent(studentId, { className: toClassName });
  revalidateEverything();
  return { ok: true };
}

export interface ImportResult {
  created: number;
  skipped: { row: number; reason: string }[];
}

/** Nhập nhiều học sinh từ Excel. Kiểm tra lại từng dòng ở server, dòng lỗi bị bỏ qua và báo lý do. */
export async function importStudentsAction(
  rows: { rowNumber: number; input: StudentInput }[],
): Promise<({ ok: true } & ImportResult) | Fail> {
  await requireAdminAction();

  if (rows.length === 0) return { ok: false, error: "Không có dòng nào để nhập." };
  if (rows.length > 500) return { ok: false, error: "Mỗi lần nhập tối đa 500 học sinh." };

  const names = await classNames();
  const existing = new Set((await getStudents()).map((s) => `${s.fullName.trim().toLowerCase()}|${s.parentPhone}`));
  const valid: Parameters<typeof createStudents>[0] = [];
  const skipped: ImportResult["skipped"] = [];
  const today = toISODate(new Date());

  for (const { rowNumber, input } of rows) {
    const errors = validateStudentInput(input, names);
    if (Object.keys(errors).length > 0) {
      skipped.push({ row: rowNumber, reason: firstError(errors) });
      continue;
    }
    const phone = normalizePhone(input.parentPhone);
    const fullName = input.fullName.trim().replace(/\s+/g, " ");
    const key = `${fullName.toLowerCase()}|${phone}`;
    if (existing.has(key)) {
      skipped.push({ row: rowNumber, reason: "Trùng tên và số điện thoại với học sinh đã có." });
      continue;
    }
    existing.add(key);
    valid.push({
      fullName,
      className: input.className,
      parentName: input.parentName.trim(),
      parentPhone: phone,
      dateOfBirth: input.dateOfBirth,
      enrolledDate: input.enrolledDate || today,
    });
  }

  if (valid.length > 0) await createStudents(valid);
  revalidateEverything();
  return { ok: true, created: valid.length, skipped };
}


/** Bật/tắt quyền truy cập Parent Portal trên cùng tài khoản học sinh. */
export async function updateParentAccessAction(
  studentId: string,
  enabled: boolean,
): Promise<{ ok: true } | Fail> {
  await requireAdminAction();

  if (typeof enabled !== "boolean") {
    return { ok: false, error: "Trạng thái quyền truy cập không hợp lệ." };
  }

  const student = await getStudentById(studentId);
  if (!student) return { ok: false, error: "Không tìm thấy học sinh." };
  if (enabled && student.status !== "active") {
    return { ok: false, error: "Chỉ có thể bật Parent Portal cho học sinh đang học." };
  }

  await updateStudent(studentId, { parentAccessEnabled: enabled });
  revalidateEverything();
  return { ok: true };
}

