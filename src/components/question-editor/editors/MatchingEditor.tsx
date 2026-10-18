import { Button } from "@/components/ui/Button";
import { newId } from "@/lib/question-types";
import styles from "./editors.module.css";
import type { EditorProps } from "./types";

const MAX_PAIRS = 8;

export function MatchingEditor({ question, errors, onChange }: EditorProps) {
  function setPair(id: string, side: "left" | "right", value: string) {
    onChange({ pairs: question.pairs.map((p) => (p.id === id ? { ...p, [side]: value } : p)) });
  }

  function remove(id: string) {
    if (question.pairs.length <= 2) return;
    onChange({ pairs: question.pairs.filter((p) => p.id !== id) });
  }

  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>Các cặp cần nối</legend>
      <p className={styles.hint}>Học sinh sẽ thấy vế phải bị xáo trộn và phải nối đúng với vế trái.</p>
      {question.pairs.map((pair, index) => (
        <div key={pair.id} className={styles.row}>
          <input
            className={styles.text}
            value={pair.left}
            onChange={(e) => setPair(pair.id, "left", e.target.value)}
            placeholder="Vế trái"
            aria-label={`Cặp ${index + 1}, vế trái`}
          />
          <span className={styles.pairArrow} aria-hidden="true">
            nối với
          </span>
          <input
            className={styles.text}
            value={pair.right}
            onChange={(e) => setPair(pair.id, "right", e.target.value)}
            placeholder="Vế phải"
            aria-label={`Cặp ${index + 1}, vế phải`}
          />
          <Button
            onClick={() => remove(pair.id)}
            disabled={question.pairs.length <= 2}
            aria-label={`Xóa cặp ${index + 1}`}
          >
            Xóa
          </Button>
        </div>
      ))}
      {errors.pairs ? <p className={styles.error} role="alert">{errors.pairs}</p> : null}
      <div>
        <Button
          onClick={() => onChange({ pairs: [...question.pairs, { id: newId(), left: "", right: "" }] })}
          disabled={question.pairs.length >= MAX_PAIRS}
        >
          + Thêm cặp
        </Button>
      </div>
    </fieldset>
  );
}
