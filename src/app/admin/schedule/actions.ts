"use server";

import { requireAdminAction } from "@/lib/action-auth";
import { getClasses } from "@/mocks/classes";
import type { WeeklySchedule } from "@/types/weekly-schedule";
import { copyPreviousWeek, createMakeupSession, getMonday, getOrCreateWeek, getStoredWeek, publishWeeklySchedule, reopenWeeklySchedule, updateWeeklySession } from "@/mocks/weekly-schedules";
import { getTeacherAssignments } from "@/mocks/teacher-assignments";
import { getTeachers, getTeacherAccount } from "@/mocks/teachers";

type Result = { ok: true; week?: WeeklySchedule } | { ok: false; error: string };
function withinPlanningWindow(weekStart: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) return false;
  const currentMonday = getMonday(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }));
  const target = getMonday(weekStart);
  const limit = new Date(`${currentMonday}T12:00:00`);
  limit.setDate(limit.getDate() + 28);
  const maxDate = `${limit.getFullYear()}-${String(limit.getMonth() + 1).padStart(2, "0")}-${String(limit.getDate()).padStart(2, "0")}`;
  return target <= maxDate;
}
export async function prepareWeekAction(weekStart: string): Promise<Result> {
  await requireAdminAction();
  if (!withinPlanningWindow(weekStart)) return { ok: false, error: "Chỉ có thể tạo lịch trước tối đa 4 tuần." };
  const [classes, assignments] = await Promise.all([getClasses(), getTeacherAssignments()]);
  const week = getOrCreateWeek(weekStart, classes, assignments);
  return { ok: true, week };
}
export async function copyWeekAction(weekStart: string): Promise<Result> {
  await requireAdminAction();
  if (!withinPlanningWindow(weekStart)) return { ok: false, error: "Chỉ có thể tạo lịch trước tối đa 4 tuần." };
  const [classes, assignments] = await Promise.all([getClasses(), getTeacherAssignments()]);
  const week = copyPreviousWeek(weekStart, classes, assignments);
  return { ok: true, week };
}
export async function updateWeeklySessionAction(formData: FormData): Promise<Result> {
  await requireAdminAction();
  const weekStart = String(formData.get("weekStart") ?? "");
  const sessionId = String(formData.get("sessionId") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const teacherIds = formData.getAll("teacherIds").map(String).filter(Boolean);
  const status = String(formData.get("status") ?? "scheduled");
  const changeReason = String(formData.get("changeReason") ?? "").trim();
  if (status !== "scheduled" && status !== "cancelled") return { ok: false, error: "Trạng thái buổi học không hợp lệ." };
  const allTeachers = await getTeachers();
  for (const teacherId of teacherIds) {
    const teacher = allTeachers.find((item) => item.id === teacherId);
    const account = teacher ? await getTeacherAccount(teacherId) : undefined;
    if (!teacher || teacher.employmentStatus !== "working" || account?.status !== "active") {
      return { ok: false, error: "Có giáo viên không còn hoạt động hoặc không hợp lệ trong danh sách chọn." };
    }
  }
  const result = updateWeeklySession(weekStart, sessionId, { startTime, endTime, teacherIds, status, changeReason }, await getClasses());
  if (!result.ok) return result;
  return { ok: true, week: getStoredWeek(weekStart) };
}
export async function publishWeekAction(weekStart: string): Promise<Result> {
  await requireAdminAction();
  const result = publishWeeklySchedule(weekStart);
  if (!result.ok) return result;
  return { ok: true, week: getStoredWeek(weekStart) };
}
export async function reopenWeekAction(weekStart: string): Promise<Result> {
  await requireAdminAction();
  const result = reopenWeeklySchedule(weekStart);
  if (!result.ok) return result;
  return { ok: true, week: getStoredWeek(weekStart) };
}

export async function createMakeupSessionAction(formData: FormData): Promise<Result> {
  await requireAdminAction();
  const weekStart = String(formData.get("weekStart") ?? "");
  const originalSessionId = String(formData.get("originalSessionId") ?? "");
  const date = String(formData.get("date") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const teacherIds = formData.getAll("teacherIds").map(String).filter(Boolean);
  const reason = String(formData.get("reason") ?? "").trim();
  const allTeachers = await getTeachers();
  for (const teacherId of teacherIds) {
    const teacher = allTeachers.find((item) => item.id === teacherId);
    const account = teacher ? await getTeacherAccount(teacherId) : undefined;
    if (!teacher || teacher.employmentStatus !== "working" || account?.status !== "active") {
      return { ok: false, error: "Có giáo viên không còn hoạt động hoặc không hợp lệ." };
    }
  }
  const result = createMakeupSession(weekStart, originalSessionId, date, startTime, endTime, teacherIds, reason, await getClasses());
  if (!result.ok) return result;
  return { ok: true, week: getStoredWeek(weekStart) };
}

export async function getScheduleAuditLogsAction(weekStart: string) {
  await requireAdminAction();
  const { getScheduleAuditLogs } = await import("@/mocks/weekly-schedules");
  return getScheduleAuditLogs(weekStart);
}
