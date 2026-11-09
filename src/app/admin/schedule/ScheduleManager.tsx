"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import type { ScheduleAuditLog, WeeklySchedule } from "@/types/weekly-schedule";
import { Button } from "@/components/ui/Button";
import { copyWeekAction, createMakeupSessionAction, getScheduleAuditLogsAction, prepareWeekAction, publishWeekAction, reopenWeekAction, updateWeeklySessionAction } from "./actions";
import styles from "./ScheduleManager.module.css";

type ClassOption = { id: string; name: string; grade: number; studentCount: number };
type TeacherOption = { id: string; name: string; code: string; active: boolean };
const DAY_LABELS = [{ value: 2, short: "T2", label: "Thứ 2" }, { value: 3, short: "T3", label: "Thứ 3" }, { value: 4, short: "T4", label: "Thứ 4" }, { value: 5, short: "T5", label: "Thứ 5" }, { value: 6, short: "T6", label: "Thứ 6" }, { value: 7, short: "T7", label: "Thứ 7" }, { value: 8, short: "CN", label: "Chủ nhật" }];
function parseDate(value: string) { return new Date(`${value}T12:00:00`); }
function addDays(value: string, amount: number) { const date = parseDate(value); date.setDate(date.getDate() + amount); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function formatDate(value: string) { return parseDate(value).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }); }
function dayValue(value: string) { const day = parseDate(value).getDay(); return day === 0 ? 8 : day + 1; }
function weekLabel(start: string) { const end = addDays(start, 6); return `${formatDate(start)} – ${formatDate(end)}/${parseDate(end).getFullYear()}`; }

export function ScheduleManager({ classes, teachers, initialWeek, initialAuditLogs }: { classes: ClassOption[]; teachers: TeacherOption[]; initialWeek: WeeklySchedule; initialAuditLogs: ScheduleAuditLog[] }) {
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [weekStart, setWeekStart] = useState(initialWeek.weekStart);
  const [week, setWeek] = useState(initialWeek);
  useEffect(() => { setWeek(initialWeek); setWeekStart(initialWeek.weekStart); setAuditLogs(initialAuditLogs); }, [initialWeek, initialAuditLogs]);
  const [selectedDay, setSelectedDay] = useState(dayValue(dateKey(new Date())));
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const today = dateKey(new Date());
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => { const date = addDays(weekStart, index); return { date, weekday: dayValue(date), sessions: week.sessions.filter((session) => session.date === date && (teacherFilter === "all" || session.teacherIds.includes(teacherFilter))).sort((a, b) => a.startTime.localeCompare(b.startTime)) }; }), [weekStart, week, teacherFilter]);
  const total = week.sessions.filter((item) => item.status === "scheduled").length;
  const assigned = week.sessions.filter((item) => item.status === "scheduled" && item.teacherIds.length > 0).length;
  const selected = days.find((day) => day.weekday === selectedDay) ?? days[0];

  function runAction(action: () => Promise<{ ok: boolean; error?: string; week?: WeeklySchedule }>, message: string) {
    setError(""); setSuccess("");
    startTransition(async () => { const result = await action(); if (!result.ok) { setError(result.error ?? "Không thể thực hiện thao tác."); return; } if (result.week) setWeek(result.week); setAuditLogs(await getScheduleAuditLogsAction(weekStart)); setSuccess(message); });
  }
  function navigateWeek(offset: number) {
    const next = addDays(weekStart, offset * 7);
    setWeekStart(next);
    setError(""); setSuccess("");
    startTransition(async () => {
      const result = await prepareWeekAction(next);
      if (!result.ok) { setError(result.error ?? "Không thể tải lịch tuần."); return; }
      if (result.week) setWeek(result.week);
      setAuditLogs(await getScheduleAuditLogsAction(next));
    });
  }
  function saveSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess("");
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateWeeklySessionAction(formData);
      if (!result.ok) { setError(result.error ?? "Không thể lưu buổi học."); return; }
      if (result.week) setWeek(result.week); setAuditLogs(await getScheduleAuditLogsAction(weekStart)); setSuccess("Đã cập nhật buổi học.");
    });
  }
  function createMakeup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess("");
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createMakeupSessionAction(formData);
      if (!result.ok) { setError(result.error ?? "Không thể tạo buổi học bù."); return; }
      if (result.week) setWeek(result.week);
      setAuditLogs(await getScheduleAuditLogsAction(weekStart));
      setSuccess("Đã tạo buổi học bù. Hãy kiểm tra lịch trước khi công bố.");
    });
  }

  return <div className={styles.page}>
    <section className={styles.toolbar}>
      <div className={styles.weekControls}>
        <button type="button" className={styles.arrow} onClick={() => navigateWeek(-1)} aria-label="Tuần trước" disabled={pending}>‹</button>
        <div className={styles.weekLabel}><strong>{weekLabel(weekStart)}</strong><span>{week.status === "published" ? "Đã công bố" : "Bản nháp"}</span></div>
        <button type="button" className={styles.arrow} onClick={() => navigateWeek(1)} aria-label="Tuần sau" disabled={pending}>›</button>
        <button type="button" className={styles.todayButton} onClick={() => navigateWeek(Math.round((new Date(`${initialWeek.weekStart}T12:00:00`).getTime() - parseDate(weekStart).getTime()) / 604800000))}>Tuần hiện tại</button>
      </div>
      <div className={styles.toolbarActions}>
        <label className={styles.filterLabel}><span>Lọc giáo viên</span><select value={teacherFilter} onChange={(event) => setTeacherFilter(event.target.value)}><option value="all">Tất cả giáo viên</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></label>
        <Button variant="secondary" onClick={() => runAction(() => copyWeekAction(weekStart), "Đã sao chép lịch tuần trước. Kiểm tra lại trước khi công bố.")}>Sao chép tuần trước</Button>
        {week.status === "published" ? <Button variant="secondary" onClick={() => runAction(() => reopenWeekAction(weekStart), "Đã mở lại lịch ở trạng thái bản nháp.")}>Mở lại bản nháp</Button> : <Button variant="primary" onClick={() => runAction(() => publishWeekAction(weekStart), "Đã công bố lịch tuần.")}>Công bố lịch</Button>}
      </div>
    </section>
    <section className={styles.stats}>
      <article><span>Buổi học dự kiến</span><strong>{total}</strong></article>
      <article><span>Đã phân công giáo viên</span><strong className={styles.good}>{assigned}</strong></article>
      <article><span>Chưa phân công</span><strong className={total - assigned ? styles.warning : styles.good}>{total - assigned}</strong></article>
    </section>
    {error && <p className={styles.error} role="alert">{error}</p>}{success && <p className={styles.success} role="status">{success}</p>}
    <section className={styles.calendar}>
      <div className={styles.calendarHeader}><div><h2>Lịch học trong tuần</h2><p>{week.status === "published" ? "Lịch đã được công bố cho các vai trò liên quan." : "Lịch đang ở trạng thái nháp; chỉnh sửa trước khi công bố."}</p></div><span>{week.sessions.length} buổi</span></div>
      <div className={styles.weekGrid}>{days.map((day) => <section key={day.date} className={`${styles.dayColumn} ${day.date === today ? styles.today : ""}`}><header className={styles.dayHeader}><strong>{DAY_LABELS.find((item) => item.value === day.weekday)?.label}</strong><span>{formatDate(day.date)}</span></header><div className={styles.dayContent}>{day.sessions.length ? day.sessions.map((session) => <article key={session.id} className={`${styles.session} ${session.status === "cancelled" ? styles.unassignedSession : ""}`}><span className={styles.sessionTime}>{session.startTime} – {session.endTime}</span><strong>{classes.find((item) => item.id === session.classId)?.name ?? session.classId}{session.type === "makeup" ? " · Học bù" : ""}</strong><span className={styles.teacher}>{session.status === "cancelled" ? "Đã huỷ" : session.teacherIds.map((id) => teachers.find((teacher) => teacher.id === id)?.name ?? id).join(", ") || "Chưa phân công"}</span><details className={styles.editDetails}>
        <summary>Điều chỉnh buổi học</summary>
        <form className={styles.sessionForm} onSubmit={saveSession}>
          <input type="hidden" name="weekStart" value={weekStart}/><input type="hidden" name="sessionId" value={session.id}/>
          <label>Giờ bắt đầu<input type="time" name="startTime" defaultValue={session.startTime} required/></label>
          <label>Giờ kết thúc<input type="time" name="endTime" defaultValue={session.endTime} required/></label>
          <label>Giáo viên (có thể chọn nhiều)<select name="teacherIds" multiple defaultValue={session.teacherIds}>{teachers.filter((teacher) => teacher.active).map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name} · {teacher.code}</option>)}</select><small>Giữ Ctrl (Windows) hoặc Command (Mac) để chọn nhiều người.</small></label>
          <label>Trạng thái<select name="status" defaultValue={session.status}><option value="scheduled">Đang lên lịch</option><option value="cancelled">Huỷ buổi học</option></select></label>
          <label>Lý do thay đổi<input name="changeReason" defaultValue={session.changeReason ?? ""} placeholder="Ví dụ: giáo viên bận, đổi lịch..."/></label>
          <button type="submit" className={styles.submit} disabled={pending}>{pending ? "Đang lưu..." : "Lưu thay đổi"}</button>
          {week.status === "published" && session.status !== "cancelled" && <a className={styles.attendanceLink} href={`/admin/classes/${session.classId}/attendance/${session.id}`}>Mở điểm danh buổi này</a>}
        </form>
        {session.status === "cancelled" && <form className={styles.sessionForm} onSubmit={createMakeup}>
          <strong>Tạo buổi học bù</strong>
          <input type="hidden" name="weekStart" value={weekStart}/><input type="hidden" name="originalSessionId" value={session.id}/>
          <label>Ngày học bù<input type="date" name="date" min={weekStart} max={addDays(weekStart, 6)} defaultValue={session.date} required/></label>
          <label>Giờ bắt đầu<input type="time" name="startTime" defaultValue={session.startTime} required/></label>
          <label>Giờ kết thúc<input type="time" name="endTime" defaultValue={session.endTime} required/></label>
          <label>Giáo viên (chọn nhiều)<select name="teacherIds" multiple required>{teachers.filter((teacher) => teacher.active).map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name} · {teacher.code}</option>)}</select></label>
          <label>Lý do<input name="reason" defaultValue="Học bù cho buổi đã huỷ"/></label>
          <button type="submit" className={styles.submit} disabled={pending}>Tạo buổi học bù</button>
        </form>}
      </details></article>) : <p className={styles.noSessions}>Không có lớp</p>}</div></section>)}</div>
      <div className={styles.mobileCalendar}><div className={styles.dayPicker}>{days.map((day) => <button type="button" key={day.date} className={selectedDay === day.weekday ? styles.daySelected : ""} onClick={() => setSelectedDay(day.weekday)}><strong>{DAY_LABELS.find((item) => item.value === day.weekday)?.short}</strong><span>{parseDate(day.date).getDate()}</span>{day.sessions.length > 0 && <i>{day.sessions.length}</i>}</button>)}</div><div className={styles.mobileDayContent}><h3>{DAY_LABELS.find((item) => item.value === selected?.weekday)?.label}, {selected ? formatDate(selected.date) : ""}</h3>{selected?.sessions.length ? selected.sessions.map((session) => <article key={session.id} className={styles.session}><span className={styles.sessionTime}>{session.startTime} – {session.endTime}</span><strong>{classes.find((item) => item.id === session.classId)?.name ?? session.classId}{session.type === "makeup" ? " · Học bù" : ""}</strong><span className={styles.teacher}>{session.status === "cancelled" ? "Đã huỷ" : session.teacherIds.map((id) => teachers.find((teacher) => teacher.id === id)?.name ?? id).join(", ") || "Chưa phân công"}</span><details className={styles.editDetails}><summary>Điều chỉnh buổi học</summary><form className={styles.sessionForm} onSubmit={saveSession}><input type="hidden" name="weekStart" value={weekStart}/><input type="hidden" name="sessionId" value={session.id}/><label>Giờ bắt đầu<input type="time" name="startTime" defaultValue={session.startTime} required/></label><label>Giờ kết thúc<input type="time" name="endTime" defaultValue={session.endTime} required/></label><label>Giáo viên<select name="teacherIds" multiple defaultValue={session.teacherIds}>{teachers.filter((teacher) => teacher.active).map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name} · {teacher.code}</option>)}</select></label><label>Trạng thái<select name="status" defaultValue={session.status}><option value="scheduled">Đang lên lịch</option><option value="cancelled">Huỷ buổi học</option></select></label><label>Lý do<input name="changeReason" defaultValue={session.changeReason ?? ""}/></label><button type="submit" className={styles.submit} disabled={pending}>Lưu thay đổi</button>{week.status === "published" && session.status !== "cancelled" && <a className={styles.attendanceLink} href={`/admin/classes/${session.classId}/attendance/${session.id}`}>Mở điểm danh buổi này</a>}</form>{session.status === "cancelled" && <form className={styles.sessionForm} onSubmit={createMakeup}><strong>Tạo buổi học bù</strong><input type="hidden" name="weekStart" value={weekStart}/><input type="hidden" name="originalSessionId" value={session.id}/><label>Ngày học bù<input type="date" name="date" min={weekStart} max={addDays(weekStart, 6)} defaultValue={session.date} required/></label><label>Giờ bắt đầu<input type="time" name="startTime" defaultValue={session.startTime} required/></label><label>Giờ kết thúc<input type="time" name="endTime" defaultValue={session.endTime} required/></label><label>Giáo viên<select name="teacherIds" multiple required>{teachers.filter((teacher) => teacher.active).map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name} · {teacher.code}</option>)}</select></label><label>Lý do<input name="reason" defaultValue="Học bù cho buổi đã huỷ"/></label><button type="submit" className={styles.submit} disabled={pending}>Tạo buổi học bù</button></form>}</details></article>) : <p className={styles.noSessions}>Ngày này không có buổi học.</p>}</div></div>
    </section>
    <section className={styles.auditPanel}>
      <h2>Lịch sử thay đổi tuần này</h2>
      {auditLogs.length ? <ul>{auditLogs.map((log) => <li key={log.id}><strong>{log.action === "makeup_created" ? "Tạo buổi học bù" : log.action === "cancelled" ? "Huỷ buổi học" : log.action === "published" ? "Công bố lịch" : log.action === "reopened" ? "Mở lại bản nháp" : "Điều chỉnh buổi học"}</strong><span>{new Date(log.at).toLocaleString("vi-VN")} · {log.reason}</span></li>)}</ul> : <p>Chưa có thay đổi nào được ghi nhận.</p>}
    </section>
    <p className={styles.note}>Lịch tuần được tạo từ lịch cố định của lớp hoặc sao chép từ tuần trước. Mỗi buổi có thể điều chỉnh giờ, nhiều giáo viên hoặc huỷ độc lập. Bản nháp chưa được công bố.</p>
  </div>;
}
