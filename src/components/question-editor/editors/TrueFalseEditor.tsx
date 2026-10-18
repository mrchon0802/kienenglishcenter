import styles from "./editors.module.css";
import type { EditorProps } from "./types";

export function TrueFalseEditor({ question, onChange }: EditorProps) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>Đáp án đúng</legend>
      <div className={styles.choices}>
        <label className={styles.choice}>
          <input
            type="radio"
            name={`tf-${question.id}`}
            checked={question.trueFalseAnswer}
            onChange={() => onChange({ trueFalseAnswer: true })}
          />
          Đúng
        </label>
        <label className={styles.choice}>
          <input
            type="radio"
            name={`tf-${question.id}`}
            checked={!question.trueFalseAnswer}
            onChange={() => onChange({ trueFalseAnswer: false })}
          />
          Sai
        </label>
      </div>
    </fieldset>
  );
}
