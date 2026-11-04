import type { AttendanceRecord, AttendanceStatus } from "@/types/class";
import type { TeacherAttendanceEntry } from "@/types/teacher-attendance";
import { getClassStudents, getSessionById } from "./classes";

interface AttendanceStore { entries: TeacherAttendanceEntry[] }
const g = globalThis as typeof globalThis & { __ecTeacherAttendance?: AttendanceStore };
function store(): AttendanceStore {
  if (!g.__ecTeacherAttendance) g.__ecTeacherAttendance = { entries: [] };
  return g.__ecTeacherAttendance;
}

/** Ưu tiên dữ liệu giáo viên đã lưu; nếu chưa có thì hiển thị dữ liệu điểm danh mẫu cũ. */
export async function getTeacherAttendance(classId: string, sessionId: string): Promise<AttendanceRecord> {
  const saved = store().entries.find((item) => item.classId === classId && item.sessionId === sessionId);
  if (saved) return { ...saved.record };
  const existing = await getSessionById(classId, sessionId);
  return existing?.record ?? {};
}

export async function saveTeacherAttendance(
  classId: string,
  sessionId: string,
  record: AttendanceRecord,
  teacherId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const [students, session] = await Promise.all([getClassStudents(classId), getSessionById(classId, sessionId)]);
  if (!session) return { ok: false, error: "Không tìm thấy buổi học." };
  const validIds = new Set(students.map((student) => student.id));
  const keys = Object.keys(record);
  if (keys.length !== students.length || keys.some((id) => !validIds.has(id))) {
    return { ok: false, error: "Danh sách điểm danh không khớp với học sinh hiện tại của lớp." };
  }
  const allowed: AttendanceStatus[] = ["present", "absent", "excused"];
  if (keys.some((id) => !allowed.includes(record[id]))) {
    return { ok: false, error: "Trạng thái điểm danh không hợp lệ." };
  }
  const entry: TeacherAttendanceEntry = {
    classId,
    sessionId,
    record: { ...record },
    updatedAt: new Date().toISOString(),
    updatedBy: teacherId,
  };
  const entries = store().entries;
  const index = entries.findIndex((item) => item.classId === classId && item.sessionId === sessionId);
  if (index >= 0) entries[index] = entry;
  else entries.push(entry);
  return { ok: true };
}
