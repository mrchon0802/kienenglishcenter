import type { ClassInfo } from "@/types/class";
import type { TeacherClassAssignment } from "@/types/teacher-assignment";
import type { ScheduleAuditLog, WeeklyClassSession, WeeklySchedule } from "@/types/weekly-schedule";

interface Store { weeks: WeeklySchedule[]; audit: ScheduleAuditLog[] }
const g = globalThis as typeof globalThis & { __ecWeeklySchedules?: Store };
function store(): Store {
  if (!g.__ecWeeklySchedules) g.__ecWeeklySchedules = { weeks: [], audit: [] };
  if (!g.__ecWeeklySchedules.audit) g.__ecWeeklySchedules.audit = [];
  return g.__ecWeeklySchedules;
}

function addDays(date: string, amount: number): string {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + amount);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}
export function getMonday(date: string): string {
  const value = new Date(`${date}T12:00:00`);
  const offset = (value.getDay() + 6) % 7;
  return addDays(date, -offset);
}
function dateWeekday(date: string): number {
  const day = new Date(`${date}T12:00:00`).getDay();
  return day === 0 ? 8 : day + 1;
}
function assignmentTeacherIds(classId: string, date: string, assignments: TeacherClassAssignment[]): string[] {
  return assignments
    .filter((item) => item.classId === classId && item.startDate <= date && (!item.endDate || item.endDate > date))
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .slice(0, 1)
    .map((item) => item.teacherId);
}
function buildFromFixed(weekStart: string, classes: ClassInfo[], assignments: TeacherClassAssignment[], source: "fixed" | "copied"): WeeklyClassSession[] {
  const sessions: WeeklyClassSession[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const date = addDays(weekStart, offset);
    const weekday = dateWeekday(date);
    for (const cls of classes) {
      const slot = cls.scheduleSlots?.find((item) => item.day === weekday);
      const legacyMatch = !cls.scheduleSlots?.length && cls.scheduleDays.includes(weekday);
      if (!slot && !legacyMatch) continue;
      sessions.push({
        id: `${cls.id}-${date}`,
        classId: cls.id,
        date,
        startTime: slot?.startTime ?? cls.startTime,
        endTime: slot?.endTime ?? cls.endTime,
        teacherIds: assignmentTeacherIds(cls.id, date, assignments),
        status: "scheduled",
        type: "regular",
        source,
      });
    }
  }
  return sessions.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
}
export function getStoredWeek(weekStart: string): WeeklySchedule | undefined {
  const monday = getMonday(weekStart);
  const found = store().weeks.find((week) => week.weekStart === monday);
  return found ? structuredClone(found) : undefined;
}
export function getOrCreateWeek(weekStart: string, classes: ClassInfo[], assignments: TeacherClassAssignment[]): WeeklySchedule {
  const monday = getMonday(weekStart);
  const existing = store().weeks.find((week) => week.weekStart === monday);
  if (existing) return structuredClone(existing);
  const sessions = buildFromFixed(monday, classes, assignments, "fixed");
  const created: WeeklySchedule = { weekStart: monday, status: "draft", sessions, updatedAt: new Date().toISOString(), updatedBy: "admin" };
  store().weeks.push(created);
  return structuredClone(created);
}
export function copyPreviousWeek(weekStart: string, classes: ClassInfo[], assignments: TeacherClassAssignment[]): WeeklySchedule {
  const monday = getMonday(weekStart);
  const previousMonday = addDays(monday, -7);
  const previous = store().weeks.find((week) => week.weekStart === previousMonday);
  const sessions = previous
    ? previous.sessions.filter((session) => session.status === "scheduled" && (session.type ?? "regular") === "regular").map((session) => ({
        ...session,
        id: `${session.classId}-${addDays(session.date, 7)}`,
        date: addDays(session.date, 7),
        teacherIds: [...session.teacherIds],
        status: "scheduled" as const,
        source: "copied" as const,
        changeReason: undefined,
      }))
    : buildFromFixed(monday, classes, assignments, "fixed");
  const next: WeeklySchedule = { weekStart: monday, status: "draft", sessions, updatedAt: new Date().toISOString(), updatedBy: "admin" };
  const index = store().weeks.findIndex((week) => week.weekStart === monday);
  if (index >= 0) store().weeks[index] = next;
  else store().weeks.push(next);
  return structuredClone(next);
}
export function updateWeeklySession(weekStart: string, sessionId: string, patch: Pick<WeeklyClassSession, "startTime" | "endTime" | "teacherIds" | "status" | "changeReason">, classes: ClassInfo[]): { ok: true } | { ok: false; error: string } {
  const week = store().weeks.find((item) => item.weekStart === getMonday(weekStart));
  if (!week) return { ok: false, error: "Chưa có lịch tuần. Hãy tạo lịch trước." };
  if (week.status === "published") return { ok: false, error: "Lịch đã công bố. Hãy mở lại bản nháp trước khi chỉnh sửa." };
  const session = week.sessions.find((item) => item.id === sessionId);
  if (!session) return { ok: false, error: "Không tìm thấy buổi học." };
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(patch.startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(patch.endTime) || patch.startTime >= patch.endTime) return { ok: false, error: "Khung giờ không hợp lệ." };
  if (patch.status === "scheduled" && patch.teacherIds.length === 0) return { ok: false, error: "Vui lòng chọn ít nhất một giáo viên cho buổi học." };
  const overlaps = (a: string, b: string, c: string, d: string) => a < d && c < b;
  const conflicts = week.sessions.filter((other) => other.id !== sessionId && other.date === session.date && other.status === "scheduled" && overlaps(patch.startTime, patch.endTime, other.startTime, other.endTime));
  const conflictClass = conflicts.find((other) => {
    const sharedTeacher = patch.teacherIds.some((id) => other.teacherIds.includes(id));
    const sameClass = other.classId === session.classId;
    return sharedTeacher || sameClass;
  });
  if (conflictClass) {
    const name = classes.find((item) => item.id === conflictClass.classId)?.name ?? conflictClass.classId;
    return { ok: false, error: `Bị trùng lịch với lớp ${name} trong cùng khung giờ.` };
  }
  const before = structuredClone(session);
  Object.assign(session, { ...patch, teacherIds: [...new Set(patch.teacherIds)] });
  week.updatedAt = new Date().toISOString();
  week.updatedBy = "admin";
  store().audit.unshift({
    id: `schedule-log-${Date.now()}-${store().audit.length + 1}`,
    weekStart: week.weekStart, sessionId, classId: session.classId,
    action: patch.status === "cancelled" ? "cancelled" : "updated",
    actor: "admin", at: week.updatedAt, reason: patch.changeReason?.trim() || "Điều chỉnh buổi học",
    before, after: structuredClone(session),
  });
  return { ok: true };
}

export function createMakeupSession(
  weekStart: string, originalSessionId: string, date: string, startTime: string,
  endTime: string, teacherIds: string[], reason: string, classes: ClassInfo[],
): { ok: true } | { ok: false; error: string } {
  const week = store().weeks.find((item) => item.weekStart === getMonday(weekStart));
  if (!week) return { ok: false, error: "Không tìm thấy lịch tuần." };
  if (week.status === "published") return { ok: false, error: "Hãy mở lại lịch tuần trước khi tạo buổi học bù." };
  const original = week.sessions.find((item) => item.id === originalSessionId && item.status === "cancelled");
  if (!original) return { ok: false, error: "Chỉ có thể tạo buổi bù từ buổi học đã huỷ trong tuần này." };
  if (week.sessions.some((item) => item.type === "makeup" && item.originalSessionId === originalSessionId)) return { ok: false, error: "Buổi học này đã có buổi học bù." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || getMonday(date) !== week.weekStart) return { ok: false, error: "Ngày học bù phải nằm trong tuần đang chỉnh sửa." };
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) || startTime >= endTime) return { ok: false, error: "Khung giờ học bù không hợp lệ." };
  if (!teacherIds.length) return { ok: false, error: "Vui lòng chọn ít nhất một giáo viên." };
  const uniqueTeachers = [...new Set(teacherIds)];
  const overlaps = (a: string, b: string, c: string, d: string) => a < d && c < b;
  const conflict = week.sessions.find((item) => item.status === "scheduled" && item.date === date && overlaps(startTime, endTime, item.startTime, item.endTime) && (item.classId === original.classId || item.teacherIds.some((id) => uniqueTeachers.includes(id))));
  if (conflict) {
    const name = classes.find((item) => item.id === conflict.classId)?.name ?? conflict.classId;
    return { ok: false, error: `Buổi học bù bị trùng lịch với lớp ${name}.` };
  }
  const id = `makeup-${original.classId}-${date}-${Date.now()}`;
  const session: WeeklyClassSession = {
    id, classId: original.classId, date, startTime, endTime, teacherIds: uniqueTeachers,
    status: "scheduled", type: "makeup", originalSessionId, source: "manual",
    changeReason: reason.trim() || "Học bù cho buổi đã huỷ",
  };
  week.sessions.push(session);
  week.sessions.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  week.updatedAt = new Date().toISOString();
  week.updatedBy = "admin";
  store().audit.unshift({ id: `schedule-log-${Date.now()}-makeup`, weekStart: week.weekStart, sessionId: id, classId: original.classId, action: "makeup_created", actor: "admin", at: week.updatedAt, reason: session.changeReason!, before: { id: original.id, date: original.date, status: "cancelled" }, after: structuredClone(session) });
  return { ok: true };
}

export function getScheduleAuditLogs(weekStart?: string): ScheduleAuditLog[] {
  const logs = store().audit.filter((item) => !weekStart || item.weekStart === getMonday(weekStart));
  return structuredClone(logs.slice(0, 100));
}
export function publishWeeklySchedule(weekStart: string): { ok: true } | { ok: false; error: string } {
  const week = store().weeks.find((item) => item.weekStart === getMonday(weekStart));
  if (!week) return { ok: false, error: "Không tìm thấy lịch tuần." };
  const unassigned = week.sessions.find((item) => item.status === "scheduled" && item.teacherIds.length === 0);
  if (unassigned) return { ok: false, error: "Vẫn còn buổi học chưa được phân công giáo viên." };
  week.status = "published";
  week.updatedAt = new Date().toISOString();
  week.updatedBy = "admin";
  store().audit.unshift({ id: `schedule-log-${Date.now()}-published`, weekStart: week.weekStart, sessionId: "week", classId: "", action: "published", actor: "admin", at: week.updatedAt, reason: "Công bố lịch tuần" });
  return { ok: true };
}
export function reopenWeeklySchedule(weekStart: string): { ok: true } | { ok: false; error: string } {
  const week = store().weeks.find((item) => item.weekStart === getMonday(weekStart));
  if (!week) return { ok: false, error: "Không tìm thấy lịch tuần." };
  week.status = "draft";
  week.updatedAt = new Date().toISOString();
  store().audit.unshift({ id: `schedule-log-${Date.now()}-reopened`, weekStart: week.weekStart, sessionId: "week", classId: "", action: "reopened", actor: "admin", at: week.updatedAt, reason: "Mở lại lịch tuần để chỉnh sửa" });
  return { ok: true };
}

export function getWeeklySessionById(sessionId: string): WeeklyClassSession | undefined {
  for (const week of store().weeks) {
    if (week.status !== "published") continue;
    const session = week.sessions.find((item) => item.id === sessionId);
    if (session) return structuredClone(session);
  }
  return undefined;
}

export function getPublishedWeeklySessionsForClass(classId: string): WeeklyClassSession[] {
  return store().weeks
    .filter((week) => week.status === "published")
    .flatMap((week) => week.sessions)
    .filter((session) => session.classId === classId && session.status === "scheduled")
    .map((session) => structuredClone(session))
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
}
