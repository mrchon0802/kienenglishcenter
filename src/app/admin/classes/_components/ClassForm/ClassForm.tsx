"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { validateClassInput, type ClassErrors, type ClassInput } from "@/lib/class-validation";
import { GRADE_OPTIONS } from "@/lib/question-types";
import type { ClassInfo, ClassScheduleSlot } from "@/types/class";
import type { Course } from "@/types/course";
import { createClassAction, updateClassAction } from "../../actions";
import styles from "./ClassForm.module.css";

const DAYS = [
  { value: 2, label: "Thứ 2" },
  { value: 3, label: "Thứ 3" },
  { value: 4, label: "Thứ 4" },
  { value: 5, label: "Thứ 5" },
  { value: 6, label: "Thứ 6" },
  { value: 7, label: "Thứ 7" },
  { value: 8, label: "Chủ nhật" },
];

interface ClassFormProps {
  mode: "new" | "edit";
  cls?: ClassInfo;
  courses?: Course[];
}

export function ClassForm({ mode, cls, courses = [] }: ClassFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(cls?.name ?? "");
  const [grade, setGrade] = useState(String(cls?.grade ?? 3));
  const [slots, setSlots] = useState<ClassScheduleSlot[]>(() => cls?.scheduleSlots?.length
    ? cls.scheduleSlots.map((slot) => ({ ...slot }))
    : (cls?.scheduleDays ?? []).map((day) => ({ day, startTime: cls?.startTime ?? "17:30", endTime: cls?.endTime ?? "18:30" }))
  );
  const [fee, setFee] = useState(String(cls?.monthlyFee ?? 600000));
  const [unit, setUnit] = useState(String(cls?.currentUnit ?? 1));
  const [courseId, setCourseId] = useState(cls?.courseId ?? "");
  const [errors, setErrors] = useState<ClassErrors>({});
  const [serverError, setServerError] = useState("");

  function toggleDay(day: number) {
    setSlots((prev) => prev.some((slot) => slot.day === day)
      ? prev.filter((slot) => slot.day !== day)
      : [...prev, { day, startTime: "17:30", endTime: "18:30" }].sort((a, b) => a.day - b.day));
  }

  function updateSlot(day: number, field: "startTime" | "endTime", value: string) {
    setSlots((prev) => prev.map((slot) => slot.day === day ? { ...slot, [field]: value } : slot));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: ClassInput = {
      name,
      grade: Number(grade),
      scheduleDays: slots.map((slot) => slot.day),
      scheduleSlots: slots,
      startTime: slots[0]?.startTime ?? "17:30",
      endTime: slots[0]?.endTime ?? "18:30",
      monthlyFee: Number(fee),
      currentUnit: Number(unit),
      courseId: courseId || undefined,
    };
    const found = validateClassInput(input, mode);
    setErrors(found);
    setServerError("");
    if (Object.keys(found).length > 0) return;

    startTransition(async () => {
      const res = mode === "edit" && cls ? await updateClassAction(cls.id, input) : await createClassAction(input);
      if (res.ok) router.push(`/admin/classes/${res.id}`);
      else setServerError(res.error);
    });
  }

  return (
    <Card>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {serverError ? (
          <p className={styles.failure} role="alert">
            {serverError}
          </p>
        ) : null}

        <div className={styles.grid}>
          <Input
            label="Tên lớp"
            value={name}
            error={errors.name}
            disabled={mode === "edit"}
            hint={mode === "edit" ? "Tên lớp không đổi được sau khi tạo." : "Ví dụ: 3A, 6B (chữ và số, không dấu cách)."}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
          <Select label="Khối lớp" value={grade} options={GRADE_OPTIONS} error={errors.grade} onChange={(e) => setGrade(e.target.value)} />
          <Input
            label="Học phí mỗi tháng (đ)"
            type="number"
            min={0}
            step={10000}
            value={fee}
            error={errors.monthlyFee}
            hint={mode === "edit" ? "Chỉ áp dụng cho hóa đơn tạo sau này, hóa đơn cũ giữ nguyên." : undefined}
            onChange={(e) => setFee(e.target.value)}
          />
          <Input label="Đang học Unit" type="number" min={1} max={30} value={unit} error={errors.currentUnit} onChange={(e) => setUnit(e.target.value)} />
          <label className={styles.courseField}>
            <span>Khóa học</span>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="">Chưa gắn khóa học</option>
              {(courses ?? []).filter((course) => course.status === "active").map((course) => (
                <option key={course.id} value={course.id}>{course.name} · {course.level}</option>
              ))}
            </select>
            <small>Chọn chương trình học áp dụng cho lớp này.</small>
          </label>
        </div>

        <fieldset className={styles.days}>
          <legend className={styles.legend}>Lịch học cố định theo từng ngày</legend>
          <p className={styles.scheduleHint}>Chọn ngày học, sau đó thiết lập khung giờ riêng cho từng ngày.</p>
          <div className={styles.dayList}>
            {DAYS.map((d) => {
              const active = slots.some((slot) => slot.day === d.value);
              return (
                <label key={d.value} className={`${styles.day} ${active ? styles.dayOn : ""}`}>
                  <input type="checkbox" checked={active} onChange={() => toggleDay(d.value)} />
                  <span>{d.label}</span>
                </label>
              );
            })}
          </div>
          <div className={styles.slotList}>
            {slots.map((slot) => (
              <div className={styles.slotRow} key={slot.day}>
                <strong>{DAYS.find((day) => day.value === slot.day)?.label}</strong>
                <label>Giờ bắt đầu<input type="time" value={slot.startTime} onChange={(e) => updateSlot(slot.day, "startTime", e.target.value)} /></label>
                <label>Giờ kết thúc<input type="time" value={slot.endTime} onChange={(e) => updateSlot(slot.day, "endTime", e.target.value)} /></label>
              </div>
            ))}
            {slots.length === 0 ? <p className={styles.scheduleHint}>Chưa chọn ngày học.</p> : null}
          </div>
          {errors.scheduleDays ? <p className={styles.error} role="alert">{errors.scheduleDays}</p> : null}
        </fieldset>

        <div className={styles.actions}>
          <Button href={mode === "edit" && cls ? `/admin/classes/${cls.id}` : "/admin/classes"}>Hủy</Button>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Đang lưu..." : mode === "edit" ? "Lưu thay đổi" : "Tạo lớp"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
