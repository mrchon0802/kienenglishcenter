import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatScore } from "@/lib/format";
import { formatDateTime } from "@/lib/format-datetime";
import type { SubmissionResult, Verdict } from "@/types/quiz";
import styles from "./ResultView.module.css";

interface ResultViewProps {
  result: SubmissionResult;
  kind: "practice" | "test";
  onRetry?: () => void;
}

const VERDICT_LABEL: Record<Verdict, string> = {
  correct: "Đúng",
  wrong: "Chưa đúng",
  pending: "Chờ giáo viên chấm",
  graded: "Đã chấm",
  hidden: "Đã nộp",
};

export function ResultView({ result, kind, onRetry }: ResultViewProps) {
  return (
    <>
      <Card>
        <div className={styles.summary} role="status">
          <p className={styles.label}>Điểm của em</p>
          <p className={styles.score}>
            {formatScore(result.score)} <span className={styles.outOf}>/ 10</span>
          </p>
          <p className={styles.meta}>
            Lần làm thứ {result.attemptNo} · nộp lúc {formatDateTime(result.submittedAt)}
            {result.late ? " · nộp trễ" : ""}
          </p>
          {result.pendingManual ? (
            <p className={styles.note}>
              Bài có câu tự luận chờ giáo viên chấm, điểm này là điểm tạm tính.
            </p>
          ) : null}
          {!result.answersRevealed ? (
            <p className={styles.note}>
              {kind === "test"
                ? "Đáp án và kết quả từng câu sẽ hiện sau hạn nộp của cả lớp."
                : "Giáo viên chưa cho xem đáp án của bài này."}
            </p>
          ) : null}
        </div>
        <div className={styles.actions}>
          <Button href="/student/assignments">Về danh sách bài</Button>
          {kind === "practice" && onRetry ? (
            <Button variant="primary" onClick={onRetry}>
              Làm lại bài này
            </Button>
          ) : null}
        </div>
      </Card>

      <Card title="Xem lại bài làm">
        <ol className={styles.list}>
          {result.items.map((item, index) => (
            <li key={item.questionId} className={styles.item}>
              <div className={styles.head}>
                <p className={styles.prompt}>
                  Câu {index + 1}. {item.prompt}
                </p>
                <Badge tone={item.verdict === "correct" || item.verdict === "graded" ? "teal" : "amber"}>{VERDICT_LABEL[item.verdict]}</Badge>
              </div>
              <p className={styles.line}>
                Bài làm của em: <strong>{item.yourAnswer}</strong>
              </p>
              {item.correctAnswer !== undefined ? (
                <p className={styles.line}>
                  Đáp án đúng: <strong>{item.correctAnswer}</strong>
                </p>
              ) : null}
              {item.verdict === "graded" ? (
                <p className={styles.line}>
                  Điểm câu này: <strong>{item.earned} / {item.max}</strong>
                </p>
              ) : null}
              {item.explanation ? <p className={styles.explain}>{item.explanation}</p> : null}
              {item.teacherComment ? (
                <p className={styles.explain}>Nhận xét của giáo viên: {item.teacherComment}</p>
              ) : null}
            </li>
          ))}
        </ol>
      </Card>
    </>
  );
}
