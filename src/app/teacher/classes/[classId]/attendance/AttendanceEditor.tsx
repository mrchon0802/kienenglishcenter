"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { AttendanceRecord, AttendanceStatus } from "@/types/class";
import type { Student } from "@/types/student";
import { saveTeacherAttendanceAction } from "./actions";
import styles from "./attendance.module.css";

const OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "present", label: "Có mặt" },
  { value: "absent", label: "Vắng" },
  { value: "excused", label: "Có phép" },
];

export function AttendanceEditor({ classId, sessionId, students, initial }: {
  classId: string; sessionId: string; students: Student[]; initial: AttendanceRecord;
}) {
  const [record, setRecord] = useState<AttendanceRecord>(initial);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const counts = useMemo(() => {
    const values = students.map((student) => record[student.id]);
    return {
      present: values.filter((value) => value === "present").length,
      absent: values.filter((value) => value === "absent").length,
      excused: values.filter((value) => value === "excused").length,
      unmarked: values.filter((value) => !value).length,
    };
  }, [record, students]);

  function update(studentId: string, status: AttendanceStatus) {
    setRecord((current) => ({ ...current, [studentId]: status }));
    setMessage("");
  }

  function markAllPresent() {
    setRecord(Object.fromEntries(students.map((student) => [student.id, "present" as const])));
    setMessage("");
  }

  function save() {
    startTransition(async () => {
      const result = await saveTeacherAttendanceAction(classId, sessionId, record);
      setMessage(result.ok ? "Đã lưu điểm danh thành công." : result.error);
    });
  }

  return <section className={styles.sheet}>
    <div className={styles.summary} aria-live="polite">
      <span>Có mặt <strong>{counts.present}</strong></span>
      <span>Vắng <strong>{counts.absent}</strong></span>
      <span>Có phép <strong>{counts.excused}</strong></span>
      <span>Chưa điểm danh <strong>{counts.unmarked}</strong></span>
    </div>
    <div className={styles.toolbar}><button type="button" onClick={markAllPresent}>Đánh dấu tất cả có mặt</button></div>
    <ul className={styles.list}>{students.map((student) => <li className={styles.row} key={student.id}>
      <div className={styles.student}><strong>{student.fullName}</strong><span>{student.code}</span></div>
      <fieldset className={styles.options}><legend className="sr-only">Điểm danh {student.fullName}</legend>
        {OPTIONS.map((option) => <label className={`${styles.option} ${styles[option.value]}`} key={option.value}>
          <input type="radio" name={`attendance-${student.id}`} value={option.value} checked={record[student.id] === option.value} onChange={() => update(student.id, option.value)} />
          <span>{option.label}</span>
        </label>)}
      </fieldset>
    </li>)}</ul>
    <footer className={styles.footer}>
      <div>{message ? <p role="status" className={styles.message}>{message}</p> : <p className={styles.hint}>{counts.unmarked ? `Còn ${counts.unmarked} học sinh chưa điểm danh.` : "Đã chọn trạng thái cho tất cả học sinh."}</p>}</div>
      <button type="button" onClick={save} disabled={isPending || counts.unmarked > 0}>{isPending ? "Đang lưu..." : "Lưu điểm danh"}</button>
    </footer>
    <p className={styles.back}><Link href={`/teacher/classes/${classId}/attendance`}>← Quay lại danh sách buổi học</Link></p>
  </section>;
}
