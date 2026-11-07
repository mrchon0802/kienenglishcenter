import { getStudentById } from "@/mocks/students";
import { getTeacherById } from "@/mocks/teachers";

export const DEMO_STUDENT_ID = "hs-002";
export const DEMO_TEACHER_ID = "gv-001";

export async function getCurrentStudentId(): Promise<string> {
  return DEMO_STUDENT_ID;
}

export async function getCurrentStudent() {
  return getStudentById(DEMO_STUDENT_ID);
}

export async function getCurrentTeacherId(): Promise<string> {
  return DEMO_TEACHER_ID;
}

export async function getCurrentTeacher() {
  return getTeacherById(DEMO_TEACHER_ID);
}
