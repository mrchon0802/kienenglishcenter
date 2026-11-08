import type { TeacherClassAssignment } from "@/types/teacher-assignment";
import { getTeachers, getTeacherAccount } from "./teachers";
import { getClasses } from "./classes";

interface AssignmentStore { assignments: TeacherClassAssignment[] }
const g = globalThis as typeof globalThis & { __ecTeacherAssignments?: AssignmentStore };
const SEED: TeacherClassAssignment[] = [
  { id: "assign-001", teacherId: "gv-001", classId: "1a", startDate: "2025-08-01", assignedBy: "admin", reason: "Phân công đầu năm học" },
  { id: "assign-002", teacherId: "gv-001", classId: "3a", startDate: "2025-08-01", assignedBy: "admin", reason: "Phân công đầu năm học" },
  { id: "assign-003", teacherId: "gv-002", classId: "4a", startDate: "2025-08-01", assignedBy: "admin", reason: "Phân công đầu năm học" },
  { id: "assign-004", teacherId: "gv-003", classId: "6b", startDate: "2025-08-01", assignedBy: "admin", reason: "Phân công đầu năm học" },
  { id: "assign-005", teacherId: "gv-004", classId: "9a", startDate: "2025-08-01", assignedBy: "admin", reason: "Phân công đầu năm học" },
];
function store(): AssignmentStore {
  if (!g.__ecTeacherAssignments) g.__ecTeacherAssignments = { assignments: structuredClone(SEED) };
  return g.__ecTeacherAssignments;
}
export async function getTeacherAssignments(): Promise<TeacherClassAssignment[]> {
  return [...store().assignments].sort((a,b) => b.startDate.localeCompare(a.startDate));
}
export async function getCurrentTeacherAssignment(classId: string): Promise<TeacherClassAssignment | undefined> {
  return store().assignments.find((item) => item.classId === classId && !item.endDate);
}
export async function getTeacherAssignmentOverview() {
  const [classes, teachers, assignments] = await Promise.all([getClasses(), getTeachers(), getTeacherAssignments()]);
  return Promise.all(classes.map(async (cls) => {
    const current = assignments.find((item) => item.classId === cls.id && !item.endDate);
    const teacher = current ? teachers.find((item) => item.id === current.teacherId) : undefined;
    const account = teacher ? await getTeacherAccount(teacher.id) : undefined;
    return { classId: cls.id, className: cls.name, grade: cls.grade, teacherId: teacher?.id, teacherName: teacher?.fullName, teacherCode: teacher?.teacherCode, startDate: current?.startDate, teacherAvailable: account?.status === "active" && teacher?.employmentStatus === "working" };
  }));
}
export async function assignTeacherToClass(classId: string, teacherId: string, startDate: string, reason: string): Promise<{ok:boolean;error?:string}> {
  const [classes, teachers, account] = await Promise.all([getClasses(), getTeachers(), getTeacherAccount(teacherId)]);
  if (!classes.some((item) => item.id === classId)) return { ok:false, error:"Không tìm thấy lớp học." };
  const teacher = teachers.find((item) => item.id === teacherId);
  if (!teacher) return { ok:false, error:"Không tìm thấy giáo viên." };
  if (account?.status !== "active" || teacher.employmentStatus !== "working") return { ok:false, error:"Chỉ có thể phân công giáo viên đang làm việc và có tài khoản hoạt động." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return { ok:false, error:"Ngày bắt đầu không hợp lệ." };
  const data = store();
  const current = data.assignments.find((item) => item.classId === classId && !item.endDate);
  if (current?.teacherId === teacherId) return { ok:false, error:"Giáo viên này đang phụ trách lớp." };

  if (current && startDate < current.startDate) {
    return { ok:false, error:"Ngày thay thế không được trước ngày bắt đầu phân công hiện tại." };
  }

  // Một giáo viên không thể dạy hai lớp có giờ học giao nhau trong cùng thời điểm.
  const targetClass = classes.find((item) => item.id === classId);
  if (!targetClass) return { ok:false, error:"Không tìm thấy thông tin lịch học của lớp." };

  const overlaps = (startA: string, endA: string, startB: string, endB: string) =>
    startA < endB && startB < endA;

  const conflictingAssignment = data.assignments.find((item) => {
    if (item.teacherId !== teacherId || item.classId === classId) return false;
    // Các phân công đã kết thúc trước ngày áp dụng không gây xung đột.
    if (item.endDate && item.endDate <= startDate) return false;

    const otherClass = classes.find((entry) => entry.id === item.classId);
    if (!otherClass) return false;

    const hasSameDay = targetClass.scheduleDays.some((day) => otherClass.scheduleDays.includes(day));
    return hasSameDay && overlaps(targetClass.startTime, targetClass.endTime, otherClass.startTime, otherClass.endTime);
  });

  if (conflictingAssignment) {
    const conflictingClass = classes.find((item) => item.id === conflictingAssignment.classId);
    return {
      ok:false,
      error:`Giáo viên này đã có lịch trùng với lớp ${conflictingClass?.name ?? conflictingAssignment.classId}. Vui lòng chọn giáo viên khác hoặc điều chỉnh lịch lớp.`,
    };
  }

  if (current) current.endDate = startDate;
  data.assignments.push({ id:`assign-${Date.now()}-${data.assignments.length+1}`, teacherId, classId, startDate, assignedBy:"admin", reason:reason.trim() || (current ? "Thay thế giáo viên phụ trách" : "Phân công giáo viên") });
  return {ok:true};
}
export async function unassignTeacherFromClass(classId: string, endDate: string, reason: string): Promise<{ok:boolean;error?:string}> {
  const current = await getCurrentTeacherAssignment(classId);
  if (!current) return {ok:false,error:"Lớp hiện chưa có giáo viên phụ trách."};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate) || endDate < current.startDate) return {ok:false,error:"Ngày kết thúc không hợp lệ."};
  current.endDate = endDate; current.reason = reason.trim() || "Kết thúc phân công";
  return {ok:true};
}
export async function endAssignmentsForTeacher(teacherId: string, endDate: string): Promise<void> {
  for (const item of store().assignments) if (item.teacherId === teacherId && !item.endDate) item.endDate = endDate;
}
export async function getTeacherAssignmentHistory() {
  const [assignments, teachers, classes] = await Promise.all([getTeacherAssignments(), getTeachers(), getClasses()]);
  return assignments.map((item) => ({ ...item, teacher: teachers.find((teacher) => teacher.id === item.teacherId), classInfo: classes.find((cls) => cls.id === item.classId) })).sort((a,b) => b.startDate.localeCompare(a.startDate));
}
