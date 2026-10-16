import { formatNumber } from "@/lib/format";
import styles from "./BarChart.module.css";

interface BarChartProps {
  points: { label: string; value: number }[];
  /** Mô tả toàn bộ biểu đồ cho trình đọc màn hình. */
  ariaLabel: string;
  highlightLast?: boolean;
}

export function BarChart({ points, ariaLabel, highlightLast = false }: BarChartProps) {
  const max = Math.max(...points.map((p) => p.value), 1);

  return (
    <div className={styles.chart} role="img" aria-label={ariaLabel}>
      {points.map((point, index) => {
        const isLast = highlightLast && index === points.length - 1;
        return (
          <div key={point.label} className={styles.column}>
            <div className={styles.area}>
              <div
                className={`${styles.bar} ${isLast ? styles.active : ""}`}
                style={{ height: `${(point.value / max) * 100}%` }}
              />
            </div>
            <span className={isLast ? styles.valueActive : styles.value}>
              {formatNumber(point.value)}
            </span>
            <span className={styles.label}>{point.label}</span>
          </div>
        );
      })}
    </div>
  );
}
