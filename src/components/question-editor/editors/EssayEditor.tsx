import { Textarea } from "@/components/ui/Textarea";
import styles from "./editors.module.css";
import type { EditorProps } from "./types";

export function EssayEditor({ question, onChange }: EditorProps) {
  return (
    <div className={styles.group}>
      <p className={styles.hint}>Câu tự luận không chấm tự động, giáo viên sẽ chấm tay từng bài nộp.</p>
      <Textarea
        label="Đáp án mẫu (không bắt buộc)"
        value={question.sampleAnswer}
        rows={4}
        hint="Chỉ giáo viên nhìn thấy, giúp chấm bài nhất quán."
        onChange={(e) => onChange({ sampleAnswer: e.target.value })}
      />
    </div>
  );
}
