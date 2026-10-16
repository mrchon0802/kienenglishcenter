import type {
  AttendanceRecord,
  AttendanceSummary,
  ClassInfo,
  ClassSession,
  ClassWithCount,
} from "@/types/class";
import type { Student } from "@/types/student";
import { getStudents } from "./students";

const TODAY = "2026-10-16";

const classes: ClassInfo[] = [
  { id: "1a", name: "1A", grade: 1, scheduleDays: [3, 5], startTime: "16:00", endTime: "17:00", monthlyFee: 500_000, currentUnit: 2 },
  { id: "3a", name: "3A", grade: 3, scheduleDays: [2, 4, 6], startTime: "17:30", endTime: "18:30", monthlyFee: 600_000, currentUnit: 4 },
  { id: "4a", name: "4A", grade: 4, scheduleDays: [3, 5], startTime: "17:30", endTime: "18:30", monthlyFee: 600_000, currentUnit: 5 },
  { id: "6b", name: "6B", grade: 6, scheduleDays: [2, 4, 6], startTime: "18:45", endTime: "19:45", monthlyFee: 700_000, currentUnit: 3 },
  { id: "9a", name: "9A", grade: 9, scheduleDays: [2, 4, 6], startTime: "20:00", endTime: "21:00", monthlyFee: 800_000, currentUnit: 6 },
];

/** Sinh các ngày học gần nhất (tính lùi từ TODAY) khớp với lịch của lớp. */
function recentDates(days: number[], count: number): string[] {
  const out: string[] = [];
  const cursor = new Date(Date.UTC(2026, 9, 16));
  while (out.length < count) {
    const dow = cursor.getUTCDay(); // 0 = Chủ nhật
    const vnDay = dow === 0 ? 8 : dow + 1;
    if (days.includes(vnDay)) out.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return out;
}

function studentNumber(student: Student): number {
  return Number.parseInt(student.id.replace(/\D/g, ""), 10);
}

/** Dữ liệu điểm danh mẫu cố định. Buổi học hôm nay luôn chưa điểm danh. */
function mockRecord(members: Student[], date: string, sessionIndex: number): AttendanceRecord {
  if (date === TODAY) return {};
  const record: AttendanceRecord = {};
  for (const s of members) {
    const n = studentNumber(s) * 3 + sessionIndex;
    record[s.id] = n % 7 === 0 ? "absent" : n % 11 === 0 ? "excused" : "present";
  }
  return record;
}

function summarize(record: AttendanceRecord, total: number): AttendanceSummary | undefined {
  const values = Object.values(record);
  if (values.length === 0) return undefined;
  return {
    present: values.filter((v) => v === "present").length,
    absent: values.filter((v) => v === "absent").length,
    excused: values.filter((v) => v === "excused").length,
    total,
  };
}

export async function getClasses(): Promise<ClassWithCount[]> {
  const students = await getStudents();
  return classes.map((c) => ({
    ...c,
    studentCount: students.filter((s) => s.className === c.name && s.status === "active").length,
  }));
}

export async function getClassById(id: string): Promise<ClassInfo | undefined> {
  return classes.find((c) => c.id === id);
}

export async function getClassStudents(classId: string): Promise<Student[]> {
  const cls = classes.find((c) => c.id === classId);
  if (!cls) return [];
  const students = await getStudents();
  return students.filter((s) => s.className === cls.name && s.status === "active");
}

export async function getClassSessions(classId: string): Promise<ClassSession[]> {
  const cls = classes.find((c) => c.id === classId);
  if (!cls) return [];
  const members = await getClassStudents(classId);
  return recentDates(cls.scheduleDays, 6).map((date, index) => ({
    id: `${classId}-${date}`,
    classId,
    date,
    topic: `Unit ${Math.max(1, cls.currentUnit - Math.floor(index / 2))}`,
    summary: summarize(mockRecord(members, date, index), members.length),
  }));
}

export async function getSessionById(
  classId: string,
  sessionId: string,
): Promise<{ session: ClassSession; record: AttendanceRecord } | undefined> {
  const cls = classes.find((c) => c.id === classId);
  if (!cls) return undefined;
  const members = await getClassStudents(classId);
  const dates = recentDates(cls.scheduleDays, 6);
  const index = dates.findIndex((date) => `${classId}-${date}` === sessionId);
  if (index === -1) return undefined;
  const record = mockRecord(members, dates[index], index);
  return {
    session: {
      id: sessionId,
      classId,
      date: dates[index],
      topic: `Unit ${Math.max(1, cls.currentUnit - Math.floor(index / 2))}`,
      summary: summarize(record, members.length),
    },
    record,
  };
}
