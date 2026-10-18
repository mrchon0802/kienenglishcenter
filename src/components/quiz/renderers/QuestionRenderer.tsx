"use client";

import type { AnswerValue, StudentQuestion } from "@/types/quiz";
import styles from "./QuestionRenderer.module.css";

interface RendererProps {
  question: StudentQuestion;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}

function ChoiceList({ question, value, onChange }: RendererProps) {
  const multiple = question.type === "multi";
  const selected = multiple ? (Array.isArray(value) ? value : []) : typeof value === "string" ? [value] : [];

  function pick(id: string) {
    if (!multiple) return onChange(id);
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  return (
    <fieldset className={styles.group}>
      <legend className="sr-only">{multiple ? "Chọn tất cả đáp án đúng" : "Chọn một đáp án"}</legend>
      {multiple ? <p className={styles.hint}>Chọn tất cả đáp án đúng.</p> : null}
      {question.options.map((option) => (
        <label key={option.id} className={`${styles.choice} ${selected.includes(option.id) ? styles.chosen : ""}`}>
          <input
            type={multiple ? "checkbox" : "radio"}
            name={`q-${question.id}`}
            checked={selected.includes(option.id)}
            onChange={() => pick(option.id)}
          />
          <span>{option.text}</span>
        </label>
      ))}
    </fieldset>
  );
}

function TrueFalse({ question, value, onChange }: RendererProps) {
  return (
    <fieldset className={`${styles.group} ${styles.row}`}>
      <legend className="sr-only">Đúng hay sai</legend>
      {[true, false].map((answer) => (
        <label key={String(answer)} className={`${styles.choice} ${styles.big} ${value === answer ? styles.chosen : ""}`}>
          <input type="radio" name={`q-${question.id}`} checked={value === answer} onChange={() => onChange(answer)} />
          <span>{answer ? "Đúng" : "Sai"}</span>
        </label>
      ))}
    </fieldset>
  );
}

function FillBlankPrompt({ question, value, onChange }: RendererProps) {
  const parts = question.prompt.split("___");
  const text = typeof value === "string" ? value : "";
  return (
    <p className={styles.prompt}>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 ? (
            <input
              className={styles.blank}
              value={text}
              onChange={(e) => onChange(e.target.value)}
              aria-label="Điền vào chỗ trống"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          ) : null}
        </span>
      ))}
    </p>
  );
}

function Matching({ question, value, onChange }: RendererProps) {
  const map = typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
  return (
    <ul className={styles.matchList}>
      {question.leftItems.map((left) => (
        <li key={left.id} className={styles.matchRow}>
          <span className={styles.matchLeft}>{left.text}</span>
          <select
            className={styles.select}
            value={map[left.id] ?? ""}
            onChange={(e) => {
              const next = { ...map };
              if (e.target.value) next[left.id] = e.target.value;
              else delete next[left.id];
              onChange(next);
            }}
            aria-label={`Nối "${left.text}" với`}
          >
            <option value="">Chọn...</option>
            {question.rightItems.map((right) => (
              <option key={right.id} value={right.id}>
                {right.text}
              </option>
            ))}
          </select>
        </li>
      ))}
    </ul>
  );
}

function Ordering({ question, value, onChange }: RendererProps) {
  const chosen = Array.isArray(value) ? value : [];
  const bank = [...question.words];
  for (const word of chosen) {
    const index = bank.indexOf(word);
    if (index > -1) bank.splice(index, 1);
  }

  return (
    <div className={styles.orderWrap}>
      <div>
        <p className={styles.label}>Câu của em</p>
        <div className={`${styles.chips} ${styles.answerArea}`} aria-live="polite">
          {chosen.length === 0 ? <span className={styles.hint}>Bấm vào các từ bên dưới để xếp câu.</span> : null}
          {chosen.map((word, i) => (
            <button
              key={`${word}-${i}`}
              type="button"
              className={`${styles.chip} ${styles.chipChosen}`}
              onClick={() => onChange(chosen.filter((_, idx) => idx !== i))}
              aria-label={`Bỏ từ ${word}`}
            >
              {word}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className={styles.label}>Các từ</p>
        <div className={styles.chips}>
          {bank.map((word, i) => (
            <button
              key={`${word}-${i}`}
              type="button"
              className={styles.chip}
              onClick={() => onChange([...chosen, word])}
            >
              {word}
            </button>
          ))}
        </div>
      </div>
      {chosen.length > 0 ? (
        <button type="button" className={styles.clear} onClick={() => onChange([])}>
          Xóa hết, xếp lại
        </button>
      ) : null}
    </div>
  );
}

export function QuestionRenderer(props: RendererProps) {
  const { question, value, onChange } = props;
  return (
    <div className={styles.wrap}>
      {question.type === "fillblank" ? (
        <FillBlankPrompt {...props} />
      ) : (
        <p className={styles.prompt}>{question.prompt}</p>
      )}

      {question.imageUrl.trim() ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.image} src={question.imageUrl} alt="Hình minh họa câu hỏi" />
      ) : null}
      {question.audioUrl.trim() ? <audio className={styles.audio} controls src={question.audioUrl} /> : null}

      {(question.type === "mcq" || question.type === "multi") && <ChoiceList {...props} />}
      {question.type === "truefalse" && <TrueFalse {...props} />}
      {question.type === "matching" && <Matching {...props} />}
      {question.type === "ordering" && <Ordering {...props} />}
      {question.type === "essay" && (
        <textarea
          className={styles.essay}
          rows={6}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Viết câu trả lời của em ở đây..."
          aria-label="Câu trả lời của em"
        />
      )}
    </div>
  );
}
