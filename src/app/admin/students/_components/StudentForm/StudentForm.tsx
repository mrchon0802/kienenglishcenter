"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { ClassOption } from "@/types/student";
import styles from "./StudentForm.module.css";

interface FormValues {
  fullName: string;
  dateOfBirth: string;
  className: string;
  parentName: string;
  parentPhone: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY: FormValues = {
  fullName: "",
  dateOfBirth: "",
  className: "",
  parentName: "",
  parentPhone: "",
};

const PHONE_PATTERN = /^(0|\+84)\d{9}$/;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.fullName.trim()) errors.fullName = "Nhập họ và tên học sinh.";
  if (!values.className) errors.className = "Chọn lớp cho học sinh.";
  if (!values.parentName.trim()) errors.parentName = "Nhập tên phụ huynh.";
  if (!values.parentPhone.trim()) {
    errors.parentPhone = "Nhập số điện thoại phụ huynh.";
  } else if (!PHONE_PATTERN.test(values.parentPhone.replace(/\s+/g, ""))) {
    errors.parentPhone = "Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.";
  }
  return errors;
}

export function StudentForm({ classes }: { classes: ClassOption[] }) {
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSubmitted(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // TODO (khi có backend): gọi API tạo học sinh tại đây, thành công thì chuyển về /admin/students.
    setSubmitted(true);
    setValues(EMPTY);
  }

  return (
    <Card>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {submitted ? (
          <p className={styles.notice} role="status">
            Thông tin hợp lệ. Hiện đang dùng dữ liệu mẫu nên chưa lưu thật; khi có backend, học
            sinh sẽ được tạo tại bước này.
          </p>
        ) : null}

        <div className={styles.grid}>
          <Input
            label="Họ và tên học sinh"
            value={values.fullName}
            error={errors.fullName}
            onChange={(e) => setField("fullName", e.target.value)}
            autoComplete="off"
          />
          <Input
            label="Ngày sinh"
            type="date"
            value={values.dateOfBirth}
            onChange={(e) => setField("dateOfBirth", e.target.value)}
          />
          <Select
            label="Lớp"
            placeholder="Chọn lớp"
            options={classes.map((c) => ({ value: c.name, label: `Lớp ${c.name}` }))}
            value={values.className}
            error={errors.className}
            onChange={(e) => setField("className", e.target.value)}
          />
          <Input
            label="Tên phụ huynh"
            value={values.parentName}
            error={errors.parentName}
            onChange={(e) => setField("parentName", e.target.value)}
            autoComplete="off"
          />
          <Input
            label="Số điện thoại phụ huynh"
            type="tel"
            inputMode="tel"
            value={values.parentPhone}
            error={errors.parentPhone}
            hint="Ví dụ: 0912 345 678"
            onChange={(e) => setField("parentPhone", e.target.value)}
          />
        </div>

        <div className={styles.actions}>
          <Button href="/admin/students">Hủy</Button>
          <Button type="submit" variant="primary">
            Lưu học sinh
          </Button>
        </div>
      </form>
    </Card>
  );
}
