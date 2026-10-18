"use client";

import { useState, type FormEvent } from "react";
import { AnswerEditor } from "@/components/question-editor/editors";
import { MediaFields } from "@/components/question-editor/MediaFields";
import { QuestionPreview } from "@/components/question-editor/QuestionPreview";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  DIFFICULTY_OPTIONS,
  GRADE_OPTIONS,
  QUESTION_TYPE_OPTIONS,
  SKILL_OPTIONS,
  changeQuestionType,
  createEmptyQuestion,
  validateQuestion,
  type QuestionErrors,
} from "@/lib/question-types";
import type { Difficulty, Question, QuestionType, Skill } from "@/types/question";
import styles from "./QuestionEditor.module.css";

interface QuestionEditorProps {
  initial: Question;
  mode: "new" | "edit";
}

export function QuestionEditor({ initial, mode }: QuestionEditorProps) {
  const [draft, setDraft] = useState<Question>(initial);
  const [errors, setErrors] = useState<QuestionErrors>({});
  const [notice, setNotice] = useState<"" | "saved" | "invalid">("");
  const [showAnswer, setShowAnswer] = useState(true);

  function update(patch: Partial<Question>) {
    setDraft((prev) => ({ ...prev, ...patch }));
    setNotice("");
  }

  function handleTypeChange(type: QuestionType) {
    setDraft((prev) => changeQuestionType(prev, type));
    setErrors({});
    setNotice("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateQuestion(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setNotice("invalid");
      return;
    }

    // TODO (khi có backend): gọi API tạo/cập nhật câu hỏi tại đây.
    setNotice("saved");
    if (mode === "new") {
      // Làm trống nội dung để nhập câu tiếp, giữ nguyên phần phân loại (lớp, unit, kỹ năng...).
      setDraft((prev) => ({
        ...createEmptyQuestion(prev.type),
        grade: prev.grade,
        book: prev.book,
        unit: prev.unit,
        skill: prev.skill,
        difficulty: prev.difficulty,
        points: prev.points,
      }));
    }
  }

  return (
    <form className={styles.layout} onSubmit={handleSubmit} noValidate>
      <div className={styles.main}>
        {notice === "saved" ? (
          <p className={styles.success} role="status">
            Câu hỏi hợp lệ. Hiện đang dùng dữ liệu mẫu nên chưa lưu thật.
            {mode === "new"
              ? " Form đã được làm trống để bạn nhập câu tiếp, phần phân loại được giữ nguyên."
              : ""}
          </p>
        ) : null}
        {notice === "invalid" ? (
          <p className={styles.failure} role="alert">
            Còn mục chưa hợp lệ, hãy xem các dòng báo lỗi màu đỏ bên dưới.
          </p>
        ) : null}

        <Card title="Dạng câu hỏi">
          <Select
            label="Dạng câu hỏi"
            value={draft.type}
            disabled={mode === "edit"}
            options={QUESTION_TYPE_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
            onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
          />
          <p className={styles.hint}>
            {mode === "edit"
              ? "Không đổi dạng câu khi sửa. Muốn đổi dạng, hãy tạo câu hỏi mới."
              : QUESTION_TYPE_OPTIONS.find((t) => t.value === draft.type)?.description}
          </p>
        </Card>

        <Card title="Nội dung câu hỏi">
          <div className={styles.stack}>
            <Textarea
              label="Nội dung câu hỏi"
              value={draft.prompt}
              error={errors.prompt}
              hint={
                draft.type === "fillblank"
                  ? 'Gõ "___" (3 dấu gạch dưới) ở chỗ cần học sinh điền. Ví dụ: My name ___ Lan.'
                  : undefined
              }
              onChange={(e) => update({ prompt: e.target.value })}
            />
            <MediaFields
              imageUrl={draft.imageUrl}
              audioUrl={draft.audioUrl}
              onChange={(patch) => update(patch)}
            />
          </div>
        </Card>

        <Card title="Đáp án">
          <AnswerEditor question={draft} errors={errors} onChange={update} />
        </Card>

        <Card title="Phân loại và chấm điểm">
          <div className={styles.stack}>
            <div className={styles.fields}>
              <Select
                label="Lớp"
                value={String(draft.grade)}
                options={GRADE_OPTIONS}
                onChange={(e) => update({ grade: Number(e.target.value) })}
              />
              <Input
                label="Sách"
                value={draft.book}
                onChange={(e) => update({ book: e.target.value })}
              />
              <Input
                label="Unit"
                type="number"
                min={1}
                max={30}
                value={draft.unit}
                error={errors.unit}
                onChange={(e) => update({ unit: Number(e.target.value) })}
              />
              <Select
                label="Kỹ năng"
                value={draft.skill}
                options={SKILL_OPTIONS}
                onChange={(e) => update({ skill: e.target.value as Skill })}
              />
              <Select
                label="Độ khó"
                value={String(draft.difficulty)}
                options={DIFFICULTY_OPTIONS}
                onChange={(e) => update({ difficulty: Number(e.target.value) as Difficulty })}
              />
              <Input
                label="Điểm"
                type="number"
                step={0.5}
                min={0.5}
                value={draft.points}
                error={errors.points}
                onChange={(e) => update({ points: Number(e.target.value) })}
              />
            </div>
            <Textarea
              label="Giải thích đáp án (không bắt buộc)"
              value={draft.explanation}
              hint="Học sinh sẽ thấy phần này khi xem lại bài, tùy cách bạn cài đặt hiện đáp án."
              onChange={(e) => update({ explanation: e.target.value })}
            />
          </div>
        </Card>

        <div className={styles.actions}>
          <Button href="/admin/question-bank">Hủy</Button>
          <Button type="submit" variant="primary">
            Lưu câu hỏi
          </Button>
        </div>
      </div>

      <aside className={styles.side} aria-label="Xem trước câu hỏi">
        <Card title="Xem trước (học sinh sẽ thấy)">
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={showAnswer}
              onChange={(e) => setShowAnswer(e.target.checked)}
            />
            Hiện đáp án đúng
          </label>
          <QuestionPreview question={draft} showAnswer={showAnswer} />
        </Card>
      </aside>
    </form>
  );
}
