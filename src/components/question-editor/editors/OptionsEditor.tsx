import { Button } from "@/components/ui/Button";
import { newId } from "@/lib/question-types";
import styles from "./editors.module.css";
import type { EditorProps } from "./types";

const MAX_OPTIONS = 6;

/** Dùng cho cả trắc nghiệm 1 đáp án (radio) và nhiều đáp án (checkbox). */
export function OptionsEditor({ question, errors, onChange }: EditorProps) {
  const multi = question.type === "multi";

  function setText(id: string, text: string) {
    onChange({ options: question.options.map((o) => (o.id === id ? { ...o, text } : o)) });
  }

  function toggleCorrect(id: string) {
    if (!multi) {
      onChange({ correctOptionIds: [id] });
      return;
    }
    const has = question.correctOptionIds.includes(id);
    onChange({
      correctOptionIds: has
        ? question.correctOptionIds.filter((c) => c !== id)
        : [...question.correctOptionIds, id],
    });
  }

  function add() {
    onChange({ options: [...question.options, { id: newId(), text: "" }] });
  }

  function remove(id: string) {
    if (question.options.length <= 2) return;
    onChange({
      options: question.options.filter((o) => o.id !== id),
      correctOptionIds: question.correctOptionIds.filter((c) => c !== id),
    });
  }

  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>Các đáp án</legend>
      <p className={styles.hint}>
        {multi ? "Tích vào tất cả đáp án đúng." : "Chọn nút tròn bên cạnh đáp án đúng."}
      </p>
      {question.options.map((option, index) => (
        <div key={option.id} className={styles.row}>
          <label className={styles.pick}>
            <input
              type={multi ? "checkbox" : "radio"}
              name={`correct-${question.id}`}
              checked={question.correctOptionIds.includes(option.id)}
              onChange={() => toggleCorrect(option.id)}
              aria-label={`Đáp án ${index + 1} là đáp án đúng`}
            />
          </label>
          <input
            className={styles.text}
            value={option.text}
            onChange={(e) => setText(option.id, e.target.value)}
            placeholder={`Đáp án ${index + 1}`}
            aria-label={`Nội dung đáp án ${index + 1}`}
          />
          <Button
            onClick={() => remove(option.id)}
            disabled={question.options.length <= 2}
            aria-label={`Xóa đáp án ${index + 1}`}
          >
            Xóa
          </Button>
        </div>
      ))}
      {errors.options ? <p className={styles.error} role="alert">{errors.options}</p> : null}
      {errors.correct ? <p className={styles.error} role="alert">{errors.correct}</p> : null}
      <div>
        <Button onClick={add} disabled={question.options.length >= MAX_OPTIONS}>
          + Thêm đáp án
        </Button>
      </div>
    </fieldset>
  );
}
