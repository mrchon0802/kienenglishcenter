"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { validateStudentInput, type StudentErrors, type StudentInput } from "@/lib/student-validation";
import type { ClassOption, Student } from "@/types/student";
import { createStudentAction, updateStudentAction } from "../../actions";
import styles from "./StudentForm.module.css";

interface StudentFormProps {
  classes: ClassOption[];
  mode?: "new" | "edit";
  student?: Student;
}

const EMPTY: StudentInput = {
  fullName: "",
  className: "",
  parentName: "",
  parentPhone: "",
  dateOfBirth: "",
  enrolledDate: "",
};

const STATUS_OPTIONS = [
  { value: "active", label: "Đang học" },
  { value: "inactive", label: "Nghỉ học" },
];

export function StudentForm({ classes, mode = "new", student }: StudentFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<StudentInput>(
    student
      ? {
          fullName: student.fullName,
          className: student.className,
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          dateOfBirth: student.dateOfBirth,
          enrolledDate: student.enrolledDate,
        }
      : EMPTY,
  );
  const [status, setStatus] = useState<"active" | "inactive">(student?.status ?? "active");
  const [errors, setErrors] = useState<StudentErrors>({});
  const [message, setMessage] = useState("");
  const [serverError, setServerError] = useState("");

  function setField<K extends keyof StudentInput>(key: K, value: StudentInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setMessage("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateStudentInput(values, classes.map((c) => c.name));
    setErrors(found);
    setServerError("");
    if (Object.keys(found).length > 0) return;

    startTransition(async () => {
      if (mode === "edit" && student) {
        const res = await updateStudentAction(student.id, { ...values, status });
        if (res.ok) {
          setMessage("Đã lưu thông tin học sinh.");
          router.refresh();
        } else setServerError(res.error);
        return;
      }
      const res = await createStudentAction(values);
      if (res.ok) {
        setMessage(`Đã thêm ${values.fullName.trim()} (mã ${res.code}). Bạn có thể nhập tiếp học sinh khác, lớp được giữ nguyên.`);
        setValues({ ...EMPTY, className: values.className }); // giữ lớp để nhập liên tiếp
      } else setServerError(res.error);
    });
  }

  return (
    <Card>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {message ? (
          <p className={styles.notice} role="status">
            {message} <Link href="/admin/students">Về danh sách</Link>
          </p>
        ) : null}
        {serverError ? (
          <p className={styles.failure} role="alert">
            {serverError}
          </p>
        ) : null}

        <div className={styles.grid}>
          <Input label="Họ và tên học sinh" value={values.fullName} error={errors.fullName} onChange={(e) => setField("fullName", e.target.value)} autoComplete="off" />
          <Input label="Ngày sinh" type="date" value={values.dateOfBirth} error={errors.dateOfBirth} onChange={(e) => setField("dateOfBirth", e.target.value)} />
          <Select
            label="Lớp"
            placeholder="Chọn lớp"
            options={classes.map((c) => ({ value: c.name, label: `Lớp ${c.name}` }))}
            value={values.className}
            error={errors.className}
            onChange={(e) => setField("className", e.target.value)}
          />
          <Input label="Tên phụ huynh" value={values.parentName} error={errors.parentName} onChange={(e) => setField("parentName", e.target.value)} autoComplete="off" />
          <Input label="Số điện thoại phụ huynh" type="tel" inputMode="tel" value={values.parentPhone} error={errors.parentPhone} hint="Ví dụ: 0912 345 678" onChange={(e) => setField("parentPhone", e.target.value)} />
          {mode === "edit" ? (
            <Select
              label="Trạng thái"
              value={status}
              options={STATUS_OPTIONS}
              onChange={(e) => {
                setStatus(e.target.value as "active" | "inactive");
                setMessage("");
              }}
            />
          ) : null}
        </div>

        {mode === "edit" ? (
          <p className={styles.hint}>
            Đổi lớp tại đây tương đương chuyển lớp: từ giờ học sinh nhận bài tập của lớp mới, hóa đơn cũ giữ nguyên.
            Học sinh nghỉ học không được tạo hóa đơn mới.
          </p>
        ) : null}

        <div className={styles.actions}>
          <Button href={mode === "edit" && student ? `/admin/students/${student.id}` : "/admin/students"}>Hủy</Button>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Đang lưu..." : "Lưu học sinh"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
