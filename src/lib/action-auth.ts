import { getStudentById } from "@/mocks/students";
import { getTeacherPortalData } from "@/mocks/teacher-portal";
import { getTeacherAssignments } from "@/mocks/teacher-assignments";
import { getCurrentStudentId, getCurrentTeacherId } from "@/lib/current-user";

export async function requireAdminAction() {
  return { ok: true };
}

export async function requireStudentAction() {
  const studentId = await getCurrentStudentId();
  const student = await getStudentById(studentId);

  if (!student || student.status !== "active") {
    throw new Error("Học viên demo hiện không hoạt động.");
  }

  return { studentId };
}

export async function requireTeacherAction() {
  const teacherId = await getCurrentTeacherId();

  return { teacherId };
}

export async function requireTeacherClassAction(classId: string) {
  const teacherId = await getCurrentTeacherId();
  const assignments = await getTeacherAssignments();

  const isAssigned = assignments.some(
    (item) =>
      item.teacherId === teacherId && item.classId === classId && !item.endDate,
  );

  if (!isAssigned) {
    throw new Error("Giáo viên demo không được phân công phụ trách lớp này.");
  }

  return { teacherId };
}

export async function assertTeacherCanAccessClass(
  teacherId: string,
  classId: string,
): Promise<void> {
  const portal = await getTeacherPortalData(teacherId);

  if (!portal?.classes.some((item) => item.id === classId)) {
    throw new Error("Giáo viên demo không được phân công phụ trách lớp này.");
  }
}

export async function requireParentAction() {
  const studentId = await getCurrentStudentId();
  const student = await getStudentById(studentId);

  if (!student || student.status !== "active") {
    throw new Error("Học viên demo hiện không hoạt động.");
  }

  return { studentId };
}
