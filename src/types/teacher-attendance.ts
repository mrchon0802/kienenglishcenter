import type { AttendanceRecord } from "@/types/class";

export interface TeacherAttendanceEntry {
  classId: string;
  sessionId: string;
  record: AttendanceRecord;
  updatedAt: string;
  updatedBy: string;
}
