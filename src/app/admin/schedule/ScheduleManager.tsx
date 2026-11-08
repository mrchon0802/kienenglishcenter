"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { assignTeacherAction } from "../teachers/assignment-actions";
import { Button } from "@/components/ui/Button";
import styles from "./ScheduleManager.module.css";

type ClassOption = {
  id: string; name: string; grade: number; days: number[];
  scheduleSlots: { day: number; startTime: string; endTime: string }[];
  startTime: string; endTime: string; studentCount: number;
};
type TeacherOption = { id: string; name: string; code: string; active: boolean };
type Assignment = {
  id: string; classId: string; teacherId: string; startDate: string;
  endDate: string | null; reason: string;
};

const DAY_LABELS = [
  { value: 2, short: "T2", label: "Thứ 2" },
  { value: 3, short: "T3", label: "Thứ 3" },
  { value: 4, short: "T4", label: "Thứ 4" },
  { value: 5, short: "T5", label: "Thứ 5" },
  { value: 6, short: "T6", label: "Thứ 6" },
  { value: 7, short: "T7", label: "Thứ 7" },
  { value: 8, short: "CN", label: "Chủ nhật" },
];

function dateKey(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}
function startOfWeek(date: Date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  return result;
}
function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}
function formatDate(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}
function dayValue(date: Date) {
  return date.getDay() === 0 ? 8 : date.getDay() + 1;
}
function formatRange(start: Date, end: Date) {
  return `${formatDate(start)} – ${formatDate(end)}/${end.getFullYear()}`;
}

export function ScheduleManager({
  classes,
  teachers,
  assignments,
}: {
  classes: ClassOption[];
  teachers: TeacherOption[];
  assignments: Assignment[];
}) {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => dayValue(new Date()));
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const weekEnd = weekDates[6];
  const todayKey = dateKey(new Date());

  const scheduled = useMemo(() => {
    return weekDates.map((date) => {
      const key = dateKey(date);
      const weekday = dayValue(date);
      const sessions = classes
        .filter((cls) => cls.days.includes(weekday))
        .map((cls) => {
          const slot = cls.scheduleSlots.find((item) => item.day === weekday);
          const assignment = assignments
            .filter((item) => item.classId === cls.id && item.startDate <= key && (!item.endDate || item.endDate > key))
            .sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
          const teacher = assignment ? teachers.find((item) => item.id === assignment.teacherId) : undefined;
          return { ...cls, startTime: slot?.startTime ?? cls.startTime, endTime: slot?.endTime ?? cls.endTime, teacherName: teacher?.name, teacherId: teacher?.id };
        })
        .filter((cls) => teacherFilter === "all" || cls.teacherId === teacherFilter)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      return { date, key, weekday, sessions };
    });
  }, [weekDates, classes, assignments, teachers, teacherFilter]);

  const totalSessions = scheduled.reduce((sum, day) => sum + day.sessions.length, 0);
  const assignedCount = scheduled.reduce((sum, day) => sum + day.sessions.filter((item) => item.teacherId).length, 0);
  const unassignedCount = totalSessions - assignedCount;

  function changeWeek(offset: number) {
    setWeekStart((current) => addDays(current, offset * 7));
  }

  function handleAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await assignTeacherAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Không thể lưu phân công.");
        return;
      }
      setSuccess("Đã lưu phân công giáo viên cho lớp.");
      form.reset();
      setShowForm(false);
      router.refresh();
    });
  }

  const selectedSchedule = scheduled.find((item) => item.weekday === selectedDay) ?? scheduled[0];

  return (
    <div className={styles.page}>
      <section className={styles.toolbar}>
        <div className={styles.weekControls}>
          <button type="button" className={styles.arrow} onClick={() => changeWeek(-1)} aria-label="Tuần trước">‹</button>
          <div className={styles.weekLabel}>
            <strong>{formatRange(weekStart, weekEnd)}</strong>
            <span>{weekStart.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}</span>
          </div>
          <button type="button" className={styles.arrow} onClick={() => changeWeek(1)} aria-label="Tuần sau">›</button>
          <button type="button" className={styles.todayButton} onClick={() => { setWeekStart(startOfWeek(new Date())); setSelectedDay(dayValue(new Date())); }}>Tuần này</button>
        </div>
        <div className={styles.toolbarActions}>
          <label className={styles.filterLabel}>
            <span>Lọc giáo viên</span>
            <select value={teacherFilter} onChange={(event) => setTeacherFilter(event.target.value)}>
              <option value="all">Tất cả giáo viên</option>
              {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
            </select>
          </label>
          <Button variant="primary" onClick={() => { setShowForm((value) => !value); setError(""); }}>+ Xếp lịch dạy</Button>
        </div>
      </section>

      <section className={styles.stats}>
        <article><span>Tổng số buổi trong tuần</span><strong>{totalSessions}</strong></article>
        <article><span>Đã có giáo viên</span><strong className={styles.good}>{assignedCount}</strong></article>
        <article><span>Chưa phân công</span><strong className={unassignedCount ? styles.warning : styles.good}>{unassignedCount}</strong></article>
      </section>

      {success && <p className={styles.success} role="status">{success}</p>}
      {showForm && (
        <section className={styles.formPanel}>
          <div className={styles.formHeading}>
            <div><h2>Xếp lịch giáo viên cho lớp</h2><p>Lịch học và khung giờ được lấy từ cấu hình hiện tại của lớp.</p></div>
            <button type="button" className={styles.close} onClick={() => setShowForm(false)} aria-label="Đóng form">×</button>
          </div>
          <form className={styles.form} onSubmit={handleAssign}>
            <label>Lớp học
              <select name="classId" required defaultValue="">
                <option value="" disabled>Chọn lớp cần phân công</option>
                {classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.name} · Khối {cls.grade}</option>)}
              </select>
            </label>
            <label>Giáo viên
              <select name="teacherId" required defaultValue="">
                <option value="" disabled>Chọn giáo viên</option>
                {teachers.filter((teacher) => teacher.active).map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.code} · {teacher.name}</option>)}
              </select>
            </label>
            <label>Ngày bắt đầu áp dụng
              <input type="date" name="startDate" required defaultValue={dateKey(new Date())}/>
            </label>
            <label className={styles.reason}>Lý do / ghi chú (không bắt buộc)
              <input name="reason" placeholder="Ví dụ: Phân công giáo viên cho lớp mới"/>
            </label>
            {error && <p className={styles.error} role="alert">{error}</p>}
            <div className={styles.formActions}>
              <button type="button" className={styles.cancel} onClick={() => setShowForm(false)}>Hủy</button>
              <button type="submit" className={styles.submit} disabled={pending}>{pending ? "Đang lưu..." : "Lưu phân công"}</button>
            </div>
          </form>
        </section>
      )}

      <section className={styles.calendar} aria-label="Lịch dạy theo tuần">
        <div className={styles.calendarHeader}>
          <div><h2>Lịch dạy trong tuần</h2><p>Mỗi thẻ là một buổi học theo lịch định kỳ của lớp.</p></div>
          <span>{totalSessions} buổi</span>
        </div>
        <div className={styles.weekGrid}>
          {scheduled.map((day) => (
            <section key={day.key} className={`${styles.dayColumn} ${day.key === todayKey ? styles.today : ""}`}>
              <header className={styles.dayHeader}>
                <strong>{DAY_LABELS.find((item) => item.value === day.weekday)?.label}</strong>
                <span>{formatDate(day.date)}</span>
              </header>
              <div className={styles.dayContent}>
                {day.sessions.length ? day.sessions.map((session) => (
                  <article key={`${day.key}-${session.id}`} className={`${styles.session} ${!session.teacherId ? styles.unassignedSession : ""}`}>
                    <span className={styles.sessionTime}>{session.startTime} – {session.endTime}</span>
                    <strong>Lớp {session.name}</strong>
                    <span className={styles.teacher}>{session.teacherName ?? "Chưa phân công giáo viên"}</span>
                    <span className={styles.students}>{session.studentCount} học sinh</span>
                    {!session.teacherId && <span className={styles.alert}>Cần phân công</span>}
                  </article>
                )) : <p className={styles.noSessions}>Không có lớp</p>}
              </div>
            </section>
          ))}
        </div>
        <div className={styles.mobileCalendar}>
          <div className={styles.dayPicker}>
            {scheduled.map((day) => (
              <button type="button" key={day.key} className={selectedDay === day.weekday ? styles.daySelected : ""} onClick={() => setSelectedDay(day.weekday)}>
                <strong>{DAY_LABELS.find((item) => item.value === day.weekday)?.short}</strong>
                <span>{day.date.getDate()}</span>
                {day.sessions.length > 0 && <i>{day.sessions.length}</i>}
              </button>
            ))}
          </div>
          {selectedSchedule && (
            <div className={styles.mobileDayContent}>
              <h3>{DAY_LABELS.find((item) => item.value === selectedSchedule.weekday)?.label}, {formatDate(selectedSchedule.date)}</h3>
              {selectedSchedule.sessions.length ? selectedSchedule.sessions.map((session) => (
                <article key={`${selectedSchedule.key}-${session.id}`} className={`${styles.session} ${!session.teacherId ? styles.unassignedSession : ""}`}>
                  <span className={styles.sessionTime}>{session.startTime} – {session.endTime}</span>
                  <strong>Lớp {session.name}</strong>
                  <span className={styles.teacher}>{session.teacherName ?? "Chưa phân công giáo viên"}</span>
                  <span className={styles.students}>{session.studentCount} học sinh</span>
                  {!session.teacherId && <span className={styles.alert}>Cần phân công</span>}
                </article>
              )) : <p className={styles.noSessions}>Ngày này không có lịch dạy.</p>}
            </div>
          )}
        </div>
      </section>
      <p className={styles.note}>Lịch tuần được tổng hợp từ ngày học và giờ học đã cấu hình ở từng lớp, kết hợp với lịch sử phân công giáo viên. Muốn đổi ngày/giờ học định kỳ, vào chi tiết lớp để chỉnh sửa lịch học.</p>
    </div>
  );
}
