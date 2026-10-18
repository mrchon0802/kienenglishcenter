import { getSentenceWords } from "@/lib/question-types";
import type { Question } from "@/types/question";
import styles from "./QuestionPreview.module.css";

interface QuestionPreviewProps {
  question: Question;
  showAnswer: boolean;
}

/** Xáo trộn cố định (không dùng random) để bản xem trước ổn định. */
function rotate<T>(items: T[]): T[] {
  return items.length < 2 ? items : [...items.slice(1), items[0]];
}

function PromptWithBlank({ prompt }: { prompt: string }) {
  const parts = prompt.split("___");
  return (
    <p className={styles.prompt}>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 ? (
            <input className={styles.blank} disabled aria-label="Chỗ trống" />
          ) : null}
        </span>
      ))}
    </p>
  );
}

export function QuestionPreview({ question: q, showAnswer }: QuestionPreviewProps) {
  const empty = !q.prompt.trim();

  return (
    <div className={styles.preview}>
      {q.type === "fillblank" && !empty ? (
        <PromptWithBlank prompt={q.prompt} />
      ) : (
        <p className={empty ? styles.placeholder : styles.prompt}>
          {empty ? "Nội dung câu hỏi sẽ hiện ở đây." : q.prompt}
        </p>
      )}

      {q.imageUrl.trim() ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.image} src={q.imageUrl} alt="Hình minh họa câu hỏi" />
      ) : null}
      {q.audioUrl.trim() ? <audio className={styles.audio} controls src={q.audioUrl} /> : null}

      {(q.type === "mcq" || q.type === "multi") && (
        <ul className={styles.list}>
          {q.options.map((option, index) => {
            const correct = q.correctOptionIds.includes(option.id);
            return (
              <li key={option.id} className={`${styles.option} ${showAnswer && correct ? styles.correct : ""}`}>
                <input
                  type={q.type === "multi" ? "checkbox" : "radio"}
                  disabled
                  checked={showAnswer && correct}
                  readOnly
                  aria-label={`Đáp án ${index + 1}`}
                />
                <span>{option.text || `Đáp án ${index + 1}`}</span>
                {showAnswer && correct ? <strong className={styles.tick}>Đáp án đúng</strong> : null}
              </li>
            );
          })}
        </ul>
      )}

      {q.type === "truefalse" && (
        <div className={styles.tf}>
          {[true, false].map((value) => (
            <button
              key={String(value)}
              type="button"
              disabled
              className={`${styles.tfButton} ${showAnswer && q.trueFalseAnswer === value ? styles.correct : ""}`}
            >
              {value ? "Đúng" : "Sai"}
              {showAnswer && q.trueFalseAnswer === value ? " (đáp án đúng)" : ""}
            </button>
          ))}
        </div>
      )}

      {q.type === "fillblank" && showAnswer ? (
        <p className={styles.answerLine}>
          Đáp án chấp nhận: <strong>{q.acceptedAnswers.filter((a) => a.trim()).join(" / ") || "(chưa nhập)"}</strong>
        </p>
      ) : null}

      {q.type === "matching" && (
        <ul className={styles.list}>
          {q.pairs.map((pair, index) => {
            const rights = rotate(q.pairs.map((p) => p.right || "..."));
            return (
              <li key={pair.id} className={styles.matchRow}>
                <span className={styles.matchLeft}>{pair.left || `Vế trái ${index + 1}`}</span>
                <select disabled aria-label={`Nối vế trái ${index + 1}`} defaultValue="">
                  <option value="">{showAnswer ? pair.right || "..." : "Chọn..."}</option>
                  {rights.map((r, i) => (
                    <option key={i}>{r}</option>
                  ))}
                </select>
              </li>
            );
          })}
        </ul>
      )}

      {q.type === "ordering" && (
        <>
          <div className={styles.chips}>
            {[...getSentenceWords(q.sentence)].reverse().map((word, i) => (
              <span key={`${word}-${i}`} className={styles.chip}>
                {word}
              </span>
            ))}
          </div>
          {showAnswer && q.sentence.trim() ? (
            <p className={styles.answerLine}>
              Câu đúng: <strong>{q.sentence.trim()}</strong>
            </p>
          ) : null}
        </>
      )}

      {q.type === "essay" && (
        <>
          <textarea className={styles.essay} rows={4} disabled placeholder="Học sinh viết câu trả lời ở đây..." aria-label="Ô trả lời" />
          {showAnswer && q.sampleAnswer.trim() ? (
            <p className={styles.answerLine}>
              Đáp án mẫu: <strong>{q.sampleAnswer}</strong>
            </p>
          ) : null}
        </>
      )}

      {showAnswer && q.explanation.trim() ? (
        <p className={styles.explanation}>Giải thích: {q.explanation}</p>
      ) : null}
    </div>
  );
}
