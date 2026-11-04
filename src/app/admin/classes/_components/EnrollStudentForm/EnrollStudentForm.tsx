"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { transferStudentAction } from "../../../students/actions";
import styles from "./EnrollStudentForm.module.css";

interface EnrollStudentFormProps {
  className: string; // tên lớp đang xem
  candidates: { id: string; name: string; className: string }[];
}

/** Ghi danh một học sinh đang học lớp khác vào lớp này (chính là chuyển lớp). */
export function EnrollStudentForm({ className, candidates }: EnrollStudentFormProps) {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function enroll() {
    const chosen = candidates.find((c) => c.id === studentId);
    if (!chosen) return setError("Chọn học sinh cần chuyển vào lớp.");
    setError("");
    setMessage("");
    startTransition(async () => {
      const res = await transferStudentAction(studentId, className);
      if (res.ok) {
        setMessage(`Đã chuyển ${chosen.name} từ lớp ${chosen.className} sang lớp ${className}.`);
        setStudentId("");
        router.refresh();
      } else setError(res.error);
    });
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <Select
          label="Chuyển học sinh từ lớp khác vào lớp này"
          placeholder="Chọn học sinh"
          value={studentId}
          options={candidates.map((c) => ({ value: c.id, label: `${c.name} (lớp ${c.className})` }))}
          onChange={(e) => setStudentId(e.target.value)}
        />
        <Button variant="primary" onClick={enroll} disabled={pending}>
          {pending ? "Đang chuyển..." : "Chuyển vào lớp"}
        </Button>
      </div>
      {message ? (
        <p className={styles.ok} role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      <div className={styles.links}>
        <Button href="/admin/students/new">+ Thêm học sinh mới</Button>
        <Button href="/admin/students/import">Nhập danh sách từ Excel</Button>
      </div>
    </div>
  );
}
