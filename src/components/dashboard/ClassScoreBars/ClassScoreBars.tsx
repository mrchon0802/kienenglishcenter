import { Card } from "@/components/ui/Card";
import { LOW_SCORE_THRESHOLD, MAX_SCORE } from "@/lib/constants";
import { formatScore } from "@/lib/format";
import type { ClassScore } from "@/types/dashboard";
import { ProgressBar } from "../ProgressBar";
import styles from "./ClassScoreBars.module.css";

export function ClassScoreBars({ scores }: { scores: ClassScore[] }) {
  return (
    <Card title="Điểm trung bình theo lớp">
      <ul className={styles.list}>
        {scores.map((item) => (
          <li key={item.className} className={styles.row}>
            <span className={styles.name}>{item.className}</span>
            <ProgressBar
              value={item.averageScore}
              max={MAX_SCORE}
              label={`Điểm trung bình lớp ${item.className}`}
              tone={item.averageScore < LOW_SCORE_THRESHOLD ? "warning" : "primary"}
            />
            <strong className={styles.score}>{formatScore(item.averageScore)}</strong>
          </li>
        ))}
      </ul>
      <p className={styles.note}>
        Màu cam: dưới {formatScore(LOW_SCORE_THRESHOLD)}, nên xem lại
      </p>
    </Card>
  );
}
