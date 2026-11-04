"use client";

import { useId } from "react";
import styles from "./FilePicker.module.css";

interface FilePickerProps {
  label: string;
  hint?: string;
  accept?: string;
  disabled?: boolean;
  onFile: (file: File) => void;
}

export function FilePicker({ label, hint, accept = ".xlsx,.csv", disabled, onFile }: FilePickerProps) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        className={styles.input}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = ""; // cho phép chọn lại cùng một file sau khi sửa
        }}
      />
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  );
}
