"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { transferStudentAction } from "../../../students/actions";
import styles from "./TransferStudentButton.module.css";

interface TransferStudentButtonProps {
  studentId: string;
  studentName: string;
  /** Các lớp khác có thể chuyển tới. */
  classNames: string[];
}

export function TransferStudentButton({ studentId, studentName, classNames }: TransferStudentButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function transfer() {
    if (!target) return setError("Chọn lớp cần chuyển tới.");
    setError("");
    startTransition(async () => {
      const res = await transferStudentAction(studentId, target);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  if (!open) return <Button onClick={() => setOpen(true)}>Chuyển lớp</Button>;

  return (
    <div className={styles.box}>
      <Select
        label={`Chuyển ${studentName} sang lớp`}
        placeholder="Chọn lớp"
        value={target}
        options={classNames.map((c) => ({ value: c, label: `Lớp ${c}` }))}
        onChange={(e) => setTarget(e.target.value)}
      />
      <div className={styles.actions}>
        <Button variant="primary" onClick={transfer} disabled={pending}>
          {pending ? "Đang chuyển..." : "Chuyển"}
        </Button>
        <Button onClick={() => setOpen(false)} disabled={pending}>
          Hủy
        </Button>
      </div>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
