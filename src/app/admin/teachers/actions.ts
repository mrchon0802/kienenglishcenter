"use server";

import { revalidateEverything } from "@/lib/revalidate";
import { createTeacher, getTeacherById, getTeachers, setTeacherAccountStatus, updateTeacher } from "@/mocks/teachers";
import { endAssignmentsForTeacher } from "@/mocks/teacher-assignments";
import type { TeacherAccountStatus, TeacherInput } from "@/types/teacher";

type Fail = { ok: false; error: string };
function validate(input: TeacherInput, excludeId?: string): string | null {
  if (!input.fullName.trim()) return "Vui lòng nhập họ và tên giáo viên.";
  if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) return "Email không hợp lệ.";
  if (!/^0\d{9}$/.test(input.phoneNumber.replace(/\D/g, ""))) return "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.";
  if (!input.startDate) return "Vui lòng chọn ngày bắt đầu làm việc.";
  if (input.employmentStatus !== "working" && input.employmentStatus !== "inactive") return "Trạng thái làm việc không hợp lệ.";
  return null;
}
async function duplicateEmail(email: string, excludeId?: string) {
  return (await getTeachers()).some((t) => t.email.toLowerCase() === email.trim().toLowerCase() && t.id !== excludeId);
}
export async function createTeacherAction(input: TeacherInput): Promise<{ok:true;id:string;code:string}|Fail> {
  const error = validate(input); if (error) return {ok:false,error};
  if (await duplicateEmail(input.email)) return {ok:false,error:"Email này đã được sử dụng."};
  const teacher = await createTeacher(input); revalidateEverything();
  return {ok:true,id:teacher.id,code:teacher.teacherCode};
}
export async function updateTeacherAction(id: string, input: TeacherInput): Promise<{ok:true}|Fail> {
  if (!(await getTeacherById(id))) return {ok:false,error:"Không tìm thấy giáo viên."};
  const error = validate(input,id); if (error) return {ok:false,error};
  if (await duplicateEmail(input.email,id)) return {ok:false,error:"Email này đã được sử dụng."};
  await updateTeacher(id,input); revalidateEverything(); return {ok:true};
}
export async function setTeacherStatusAction(id: string, status: TeacherAccountStatus): Promise<{ok:true}|Fail> {
  if (!["pending_activation","active","locked"].includes(status)) return {ok:false,error:"Trạng thái tài khoản không hợp lệ."};
  if (!(await getTeacherById(id))) return {ok:false,error:"Không tìm thấy tài khoản giáo viên."};
  if (status === "locked") await endAssignmentsForTeacher(id, new Date().toISOString().slice(0,10));
  if (!(await setTeacherAccountStatus(id,status))) return {ok:false,error:"Không tìm thấy tài khoản giáo viên."};
  revalidateEverything(); return {ok:true};
}
