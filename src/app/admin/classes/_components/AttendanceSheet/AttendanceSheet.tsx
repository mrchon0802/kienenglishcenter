"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { AttendanceRecord, AttendanceStatus } from "@/types/class";
import type { Student } from "@/types/student";
import styles from "./AttendanceSheet.module.css";

const OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "present", label: "Có mặt" },
  { value: "absent", label: "Vắng" },
  { value: "excused", label: "Có phép" },
];

interface AttendanceSheetProps {
  students: Student[];
  initial: AttendanceRecord;
}

export function AttendanceSheet({ students, initial }: AttendanceSheetProps) {
  const [record, setRecord] = useState<AttendanceRecord>(initial);
  const [saved, setSaved] = useState(false);

  const counts = useMemo(() => {
    const values = students.map((s) => record[s.id]);
    return {
      present: values.filter((v) => v === "present").length,
      absent: values.filter((v) => v === "absent").length,
      excused: values.filter((v) => v === "excused").length,
      unmarked: values.filter((v) => v === undefined).length,
    };
  }, [students, record]);

  function mark(studentId: string, status: AttendanceStatus) {
    setRecord((prev) => ({ ...prev, [studentId]: status }));
    setSaved(false);
  }

  function markAllPresent() {
    setRecord(Object.fromEntries(students.map((s) => [s.id, "present" as const])));
    setSaved(false);
  }

  function handleSave() {
    // TODO (khi có backend): gửi `record` lên API lưu điểm danh của buổi này.
    setSaved(true);
  }

  return (
    <Card>
      <div className={styles.summary} role="status">
        <span>Có mặt {counts.present}</span>
        <span>Vắng {counts.absent}</span>
        <span>Có phép {counts.excused}</span>
        <span>Chưa điểm danh {counts.unmarked}</span>
      </div>

      <div className={styles.toolbar}>
        <Button onClick={markAllPresent}>Đánh dấu tất cả có mặt</Button>
      </div>

      <ul className={styles.list}>
        {students.map((student) => (
          <li key={student.id} className={styles.row}>
            <div>
              <p className={styles.name}>{student.fullName}</p>
              <p className={styles.code}>{student.code}</p>
            </div>
            <fieldset className={styles.options}>
              <legend className="sr-only">Điểm danh {student.fullName}</legend>
              {OPTIONS.map((option) => (
                <label key={option.value} className={`${styles.option} ${styles[option.value]}`}>
                  <input
                    type="radio"
                    name={`attendance-${student.id}`}
                    value={option.value}
                    checked={record[student.id] === option.value}
                    onChange={() => mark(student.id, option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </fieldset>
          </li>
        ))}
      </ul>

      <div className={styles.footer}>
        {saved ? (
          <p className={styles.notice} role="status">
            Đã ghi nhận. Hiện đang dùng dữ liệu mẫu nên chưa lưu thật.
          </p>
        ) : counts.unmarked > 0 ? (
          <p className={styles.hint}>Còn {counts.unmarked} học sinh chưa điểm danh.</p>
        ) : null}
        <Button variant="primary" onClick={handleSave} disabled={counts.unmarked > 0}>
          Lưu điểm danh
        </Button>
      </div>
    </Card>
  );
}
