"use server";
import { revalidateEverything } from "@/lib/revalidate";
import { assignTeacherToClass, unassignTeacherFromClass } from "@/mocks/teacher-assignments";
type Result = { ok: true } | { ok: false; error: string };
export async function assignTeacherAction(formData: FormData): Promise<Result> {
  const classId = String(formData.get("classId") ?? "");
  const teacherId = String(formData.get("teacherId") ?? "");
  const startDate = String(formData.get("startDate") ?? "");
  const reason = String(formData.get("reason") ?? "");
  if (!classId || !teacherId) return { ok:false, error:"Vui lòng chọn lớp và giáo viên." };
  const result = await assignTeacherToClass(classId, teacherId, startDate, reason);
  if (!result.ok) return {ok:false,error:result.error ?? "Không thể phân công giáo viên."};
  revalidateEverything(); return {ok:true};
}
export async function unassignTeacherAction(formData: FormData): Promise<Result> {
  const result = await unassignTeacherFromClass(String(formData.get("classId") ?? ""), String(formData.get("endDate") ?? ""), String(formData.get("reason") ?? ""));
  if (!result.ok) return {ok:false,error:result.error ?? "Không thể kết thúc phân công."};
  revalidateEverything(); return {ok:true};
}
