import { Input } from "@/components/ui/Input";
import { getSentenceWords } from "@/lib/question-types";
import styles from "./editors.module.css";
import type { EditorProps } from "./types";

export function OrderingEditor({ question, errors, onChange }: EditorProps) {
  const words = getSentenceWords(question.sentence);

  return (
    <div className={styles.group}>
      <Input
        label="Câu đúng"
        value={question.sentence}
        error={errors.sentence}
        hint="Gõ câu hoàn chỉnh. Mỗi từ cách nhau bằng dấu cách sẽ thành một thẻ để học sinh sắp xếp."
        onChange={(e) => onChange({ sentence: e.target.value })}
        autoComplete="off"
      />
      {words.length > 0 ? (
        <div>
          <p className={styles.legend}>Các thẻ từ ({words.length})</p>
          <div className={styles.chips}>
            {words.map((word, index) => (
              <span key={`${word}-${index}`} className={styles.chip}>
                {word}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
