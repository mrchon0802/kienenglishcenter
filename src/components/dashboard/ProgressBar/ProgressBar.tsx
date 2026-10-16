import styles from "./ProgressBar.module.css";

interface ProgressBarProps {
  value: number;
  max: number;
  label: string; // đọc cho trình đọc màn hình
  tone?: "primary" | "warning";
}

export function ProgressBar({ value, max, label, tone = "primary" }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={`${styles.fill} ${tone === "warning" ? styles.warning : ""}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
