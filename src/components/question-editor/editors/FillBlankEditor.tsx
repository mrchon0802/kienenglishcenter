import { Button } from "@/components/ui/Button";
import styles from "./editors.module.css";
import type { EditorProps } from "./types";

export function FillBlankEditor({ question, errors, onChange }: EditorProps) {
  function setAnswer(index: number, value: string) {
    onChange({ acceptedAnswers: question.acceptedAnswers.map((a, i) => (i === index ? value : a)) });
  }

  function remove(index: number) {
    if (question.acceptedAnswers.length <= 1) return;
    onChange({ acceptedAnswers: question.acceptedAnswers.filter((_, i) => i !== index) });
  }

  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>Đáp án được chấp nhận</legend>
      <p className={styles.hint}>
        Có thể nhập nhiều cách viết đúng (ví dụ: seven và 7). Khi chấm sẽ bỏ qua chữ hoa/thường
        và khoảng trắng thừa.
      </p>
      {question.acceptedAnswers.map((answer, index) => (
        <div key={index} className={styles.row}>
          <input
            className={styles.text}
            value={answer}
            onChange={(e) => setAnswer(index, e.target.value)}
            placeholder={`Đáp án ${index + 1}`}
            aria-label={`Đáp án chấp nhận ${index + 1}`}
          />
          <Button
            onClick={() => remove(index)}
            disabled={question.acceptedAnswers.length <= 1}
            aria-label={`Xóa đáp án ${index + 1}`}
          >
            Xóa
          </Button>
        </div>
      ))}
      {errors.answers ? <p className={styles.error} role="alert">{errors.answers}</p> : null}
      <div>
        <Button onClick={() => onChange({ acceptedAnswers: [...question.acceptedAnswers, ""] })}>
          + Thêm cách viết đúng
        </Button>
      </div>
    </fieldset>
  );
}
