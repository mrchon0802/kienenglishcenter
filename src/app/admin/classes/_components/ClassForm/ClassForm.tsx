"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { validateClassInput, type ClassErrors, type ClassInput } from "@/lib/class-validation";
import { GRADE_OPTIONS } from "@/lib/question-types";
import type { ClassInfo } from "@/types/class";
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
}

export function ClassForm({ mode, cls }: ClassFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(cls?.name ?? "");
  const [grade, setGrade] = useState(String(cls?.grade ?? 3));
  const [days, setDays] = useState<number[]>(cls?.scheduleDays ?? []);
  const [startTime, setStartTime] = useState(cls?.startTime ?? "17:30");
  const [endTime, setEndTime] = useState(cls?.endTime ?? "18:30");
  const [fee, setFee] = useState(String(cls?.monthlyFee ?? 600000));
  const [unit, setUnit] = useState(String(cls?.currentUnit ?? 1));
  const [errors, setErrors] = useState<ClassErrors>({});
  const [serverError, setServerError] = useState("");

  function toggleDay(day: number) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: ClassInput = {
      name,
      grade: Number(grade),
      scheduleDays: days,
      startTime,
      endTime,
      monthlyFee: Number(fee),
      currentUnit: Number(unit),
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
          <Input label="Giờ bắt đầu" type="time" value={startTime} error={errors.startTime} onChange={(e) => setStartTime(e.target.value)} />
          <Input label="Giờ kết thúc" type="time" value={endTime} error={errors.endTime} onChange={(e) => setEndTime(e.target.value)} />
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
        </div>

        <fieldset className={styles.days}>
          <legend className={styles.legend}>Ngày học trong tuần</legend>
          <div className={styles.dayList}>
            {DAYS.map((d) => (
              <label key={d.value} className={`${styles.day} ${days.includes(d.value) ? styles.dayOn : ""}`}>
                <input type="checkbox" checked={days.includes(d.value)} onChange={() => toggleDay(d.value)} />
                <span>{d.label}</span>
              </label>
            ))}
          </div>
          {errors.scheduleDays ? (
            <p className={styles.error} role="alert">
              {errors.scheduleDays}
            </p>
          ) : null}
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
