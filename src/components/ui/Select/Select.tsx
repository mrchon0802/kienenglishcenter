import { useId, type SelectHTMLAttributes } from "react";
import styles from "./Select.module.css";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  label: string;
  options: SelectOption[];
  /** Dòng đầu tiên có value rỗng, ví dụ "Tất cả lớp" hoặc "Chọn lớp". */
  placeholder?: string;
  error?: string;
}

export function Select({ label, options, placeholder, error, className, ...rest }: SelectProps) {
  const id = useId();

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <select
        id={id}
        className={`${styles.control} ${error ? styles.invalid : ""} ${className ?? ""}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
