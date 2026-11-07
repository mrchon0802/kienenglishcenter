"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import {
  createQuestionAction,
  updateQuestionAction,
} from "@/app/admin/question-bank/actions";
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
import type {
  Difficulty,
  Question,
  QuestionType,
  Skill,
} from "@/types/question";
import type { Curriculum } from "@/types/curriculum";
import {
  createTeacherQuestionAction,
  updateTeacherQuestionAction,
} from "@/app/teacher/questions/actions";
import styles from "./QuestionEditor.module.css";

interface QuestionEditorProps {
  initial: Question;
  mode: "new" | "edit";
  curricula?: Curriculum[];
  ownerId?: string;
  teacherMode?: boolean;
}

export function QuestionEditor({
  initial,
  mode,
  curricula = [],
  ownerId,
  teacherMode = false,
}: QuestionEditorProps) {
  const [draft, setDraft] = useState<Question>(initial);
  const [errors, setErrors] = useState<QuestionErrors>({});
  const [notice, setNotice] = useState<"" | "saved" | "invalid">("");
  const [showAnswer, setShowAnswer] = useState(true);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState("");

  const selectedCurriculum = curricula.find(
    (item) => item.id === draft.curriculumId,
  );
  const selectedUnit = selectedCurriculum?.units.find(
    (item) => item.id === draft.unitId,
  );

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
    setServerError("");
    if (!draft.curriculumId || !draft.unitId || !draft.lessonId) {
      setServerError("Vui lòng chọn đầy đủ chương trình, Unit và Lesson.");
      setNotice("invalid");
      return;
    }
    if (Object.keys(nextErrors).length > 0) {
      setNotice("invalid");
      return;
    }

    startTransition(async () => {
      const res = teacherMode
        ? mode === "edit"
          ? await updateTeacherQuestionAction(draft.id, draft)
          : await createTeacherQuestionAction(draft)
        : mode === "edit"
          ? await updateQuestionAction(draft.id, draft)
          : await createQuestionAction(draft, ownerId);
      if (!res.ok) {
        setServerError(res.error);
        return;
      }
      setNotice("saved");
      if (mode === "new") {
        // Làm trống nội dung để nhập câu tiếp, giữ nguyên phần phân loại (lớp, unit, kỹ năng...).
        setDraft((prev) => ({
          ...createEmptyQuestion(prev.type),
          grade: prev.grade,
          book: prev.book,
          unit: prev.unit,
          curriculumId: prev.curriculumId,
          unitId: prev.unitId,
          lessonId: prev.lessonId,
          skill: prev.skill,
          difficulty: prev.difficulty,
          points: prev.points,
        }));
      } else {
        router.refresh();
      }
    });
  }

  return (
    <form className={styles.layout} onSubmit={handleSubmit} noValidate>
      <div className={styles.main}>
        {notice === "saved" ? (
          <p className={styles.success} role="status">
            Đã lưu câu hỏi vào ngân hàng.
            {mode === "new"
              ? " Form đã được làm trống để bạn nhập câu tiếp, phần phân loại được giữ nguyên."
              : ""}
          </p>
        ) : null}
        {serverError ? (
          <p className={styles.failure} role="alert">
            {serverError}
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
            options={QUESTION_TYPE_OPTIONS.map((t) => ({
              value: t.value,
              label: t.label,
            }))}
            onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
          />
          <p className={styles.hint}>
            {mode === "edit"
              ? "Không đổi dạng câu khi sửa. Muốn đổi dạng, hãy tạo câu hỏi mới."
              : QUESTION_TYPE_OPTIONS.find((t) => t.value === draft.type)
                  ?.description}
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
                label="Chương trình"
                value={draft.curriculumId ?? ""}
                placeholder="Chọn chương trình"
                options={curricula
                  .filter((item) => item.status === "active")
                  .map((item) => ({ value: item.id, label: item.title }))}
                onChange={(e) => {
                  const curriculum = curricula.find(
                    (item) => item.id === e.target.value,
                  );
                  update({
                    curriculumId: e.target.value,
                    grade: curriculum?.grade ?? draft.grade,
                    unitId: "",
                    lessonId: "",
                    unit: 1,
                  });
                }}
              />
              <Select
                label="Unit"
                value={draft.unitId ?? ""}
                placeholder="Chọn Unit"
                options={(selectedCurriculum?.units ?? []).map((item) => ({
                  value: item.id,
                  label: item.title,
                }))}
                disabled={!selectedCurriculum}
                onChange={(e) => {
                  const index = (selectedCurriculum?.units ?? []).findIndex(
                    (item) => item.id === e.target.value,
                  );
                  update({
                    unitId: e.target.value,
                    lessonId: "",
                    unit: index + 1,
                  });
                }}
              />
              <Select
                label="Lesson"
                value={draft.lessonId ?? ""}
                placeholder="Chọn Lesson"
                options={(selectedUnit?.lessons ?? []).map((item) => ({
                  value: item.id,
                  label: item.title,
                }))}
                disabled={!selectedUnit}
                onChange={(e) => update({ lessonId: e.target.value })}
              />
              <Input
                label="Sách / tài liệu (không bắt buộc)"
                value={draft.book}
                onChange={(e) => update({ book: e.target.value })}
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
                onChange={(e) =>
                  update({ difficulty: Number(e.target.value) as Difficulty })
                }
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
          <Button
            href={teacherMode ? "/teacher/questions" : "/admin/question-bank"}
          >
            Hủy
          </Button>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Đang lưu..." : "Lưu câu hỏi"}
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
