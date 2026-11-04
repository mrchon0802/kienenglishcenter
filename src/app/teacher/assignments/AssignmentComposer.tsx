"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createEmptyQuestion,
  QUESTION_TYPE_OPTIONS,
  SKILL_OPTIONS,
  validateQuestion,
} from "@/lib/question-types";
import type { Question, QuestionType } from "@/types/question";
import type { AssignmentKind, ShowAnswers } from "@/types/assignment";
import { publishTeacherAssignment } from "./actions";
import styles from "./assignments.module.css";

type BankQuestion = Pick<
  Question,
  "id" | "prompt" | "type" | "points" | "grade" | "unit" | "status"
>;
type ClassOption = {
  id: string;
  name: string;
  grade: number;
  students: { id: string }[];
};

export default function AssignmentComposer({
  classes,
  bankQuestions,
}: {
  classes: ClassOption[];
  bankQuestions: BankQuestion[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<AssignmentKind>("practice");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [dueAt, setDueAt] = useState("");
  const [duration, setDuration] = useState("30");
  const [showAnswers, setShowAnswers] = useState<ShowAnswers>("after_deadline");
  const [selected, setSelected] = useState<string[]>([]);
  const [newQuestions, setNewQuestions] = useState<Question[]>([]);
  const [draft, setDraft] = useState<Question>(() =>
    createEmptyQuestion("mcq"),
  );
  const [showCreator, setShowCreator] = useState(false);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const activeQuestions = useMemo(
    () => bankQuestions.filter((q) => q.status === "active"),
    [bankQuestions],
  );

  function changeType(type: QuestionType) {
    setDraft((old) => ({
      ...createEmptyQuestion(type),
      prompt: old.prompt,
      points: old.points,
      grade: old.grade,
      unit: old.unit,
      skill: old.skill,
    }));
  }
  function addDraft() {
    const errors = validateQuestion(draft);
    if (Object.keys(errors).length) {
      setNotice(Object.values(errors)[0]);
      return;
    }
    setNewQuestions((items) => [
      ...items,
      {
        ...draft,
        id: `draft-${items.length + 1}`,
        status: "active",
        createdAt: "",
      },
    ]);
    setDraft(createEmptyQuestion("mcq"));
    setNotice(
      "Đã thêm câu hỏi vào đề. Câu hỏi sẽ được lưu vào Ngân hàng câu hỏi khi giao bài.",
    );
  }
  function updateOption(index: number, text: string) {
    setDraft((q) => ({
      ...q,
      options: q.options.map((option, i) =>
        i === index ? { ...option, text } : option,
      ),
    }));
  }
  function toggleCorrect(id: string) {
    setDraft((q) => ({
      ...q,
      correctOptionIds:
        q.type === "mcq"
          ? [id]
          : q.correctOptionIds.includes(id)
            ? q.correctOptionIds.filter((item) => item !== id)
            : [...q.correctOptionIds, id],
    }));
  }
  async function submit() {
    setNotice("");
    setSaving(true);
    const result = await publishTeacherAssignment({
      title,
      kind,
      classId,
      dueAt,
      durationMinutes: kind === "test" ? Number(duration) : null,
      showAnswers,
      questionIds: selected,
      newQuestions,
    });
    setSaving(false);
    if (!result.ok) {
      setNotice(result.error);
      return;
    }
    router.push("/teacher/assignments?created=1");
    router.refresh();
  }

  return (
    <div className={styles.formGrid}>
      <section className={styles.panel}>
        <h2>1. Thông tin giao bài</h2>
        <label className={styles.field}>
          Tên bài tập / bài kiểm tra
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Ôn tập Unit 4"
          />
        </label>
        <div className={styles.twoCols}>
          <label className={styles.field}>
            Loại bài
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as AssignmentKind)}
            >
              <option value="practice">Bài luyện tập</option>
              <option value="test">Bài kiểm tra</option>
            </select>
          </label>
          <label className={styles.field}>
            Lớp được giao
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  Lớp {item.name} · {item.students.length} học sinh
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className={styles.twoCols}>
          <label className={styles.field}>
            Hạn nộp
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </label>
          {kind === "test" ? (
            <label className={styles.field}>
              Thời gian làm bài (phút)
              <input
                type="number"
                min="1"
                max="300"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </label>
          ) : (
            <div className={styles.info}>
              Bài luyện tập không giới hạn thời gian làm bài.
            </div>
          )}
        </div>
        <label className={styles.field}>
          Hiển thị đáp án
          <select
            value={showAnswers}
            onChange={(e) => setShowAnswers(e.target.value as ShowAnswers)}
          >
            <option value="immediately">Ngay sau khi nộp</option>
            <option value="after_deadline">Sau hạn nộp</option>
            <option value="never">Không hiển thị</option>
          </select>
        </label>
      </section>
      <section className={styles.panel}>
        <div className={styles.sectionHead}>
          <div>
            <h2>2. Chọn câu hỏi</h2>
            <p>Chọn câu có sẵn hoặc tạo câu hỏi mới ngay tại đây.</p>
          </div>
          <span className={styles.count}>
            {selected.length + newQuestions.length} câu
          </span>
        </div>
        <div className={styles.questionList}>
          {activeQuestions.map((q) => (
            <label className={styles.questionRow} key={q.id}>
              <input
                type="checkbox"
                checked={selected.includes(q.id)}
                onChange={(e) =>
                  setSelected((old) =>
                    e.target.checked
                      ? [...old, q.id]
                      : old.filter((id) => id !== q.id),
                  )
                }
              />
              <span>
                <strong>{q.prompt}</strong>
                <small>
                  {q.id} · {q.type} · Khối {q.grade} · Unit {q.unit} ·{" "}
                  {q.points} điểm
                </small>
              </span>
            </label>
          ))}
        </div>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => {
            setShowCreator((v) => !v);
            setNotice("");
          }}
        >
          {showCreator ? "Đóng trình tạo câu hỏi" : "+ Tạo câu hỏi mới"}
        </button>
        {newQuestions.length > 0 && (
          <div className={styles.createdList}>
            <strong>Câu hỏi mới trong đề ({newQuestions.length})</strong>
            {newQuestions.map((q, i) => (
              <div key={q.id}>
                {i + 1}. {q.prompt}{" "}
                <button
                  type="button"
                  onClick={() =>
                    setNewQuestions((old) => old.filter((x) => x.id !== q.id))
                  }
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>
        )}
        {showCreator && (
          <div className={styles.creator}>
            <h3>Tạo câu hỏi mới</h3>
            <label className={styles.field}>
              Dạng câu hỏi
              <select
                value={draft.type}
                onChange={(e) => changeType(e.target.value as QuestionType)}
              >
                {QUESTION_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              Nội dung câu hỏi
              <textarea
                rows={3}
                value={draft.prompt}
                onChange={(e) =>
                  setDraft((q) => ({ ...q, prompt: e.target.value }))
                }
                placeholder={
                  draft.type === "fillblank"
                    ? "Ví dụ: My name ___ Lan."
                    : "Nhập nội dung câu hỏi..."
                }
              />
            </label>
            <div className={styles.twoCols}>
              <label className={styles.field}>
                Khối lớp
                <input
                  type="number"
                  min="1"
                  max="9"
                  value={draft.grade}
                  onChange={(e) =>
                    setDraft((q) => ({ ...q, grade: Number(e.target.value) }))
                  }
                />
              </label>
              <label className={styles.field}>
                Unit
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={draft.unit}
                  onChange={(e) =>
                    setDraft((q) => ({ ...q, unit: Number(e.target.value) }))
                  }
                />
              </label>
            </div>
            <div className={styles.twoCols}>
              <label className={styles.field}>
                Kỹ năng
                <select
                  value={draft.skill}
                  onChange={(e) =>
                    setDraft((q) => ({
                      ...q,
                      skill: e.target.value as Question["skill"],
                    }))
                  }
                >
                  {SKILL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                Điểm
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={draft.points}
                  onChange={(e) =>
                    setDraft((q) => ({ ...q, points: Number(e.target.value) }))
                  }
                />
              </label>
            </div>
            {(draft.type === "mcq" || draft.type === "multi") && (
              <div className={styles.answerEditor}>
                <strong>Đáp án (đánh dấu đáp án đúng)</strong>
                {draft.options.map((o, i) => (
                  <div className={styles.optionRow} key={o.id}>
                    <input
                      aria-label={`Đáp án ${i + 1}`}
                      value={o.text}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`Đáp án ${i + 1}`}
                    />
                    <label>
                      <input
                        type={draft.type === "mcq" ? "radio" : "checkbox"}
                        checked={draft.correctOptionIds.includes(o.id)}
                        onChange={() => toggleCorrect(o.id)}
                      />{" "}
                      Đúng
                    </label>
                  </div>
                ))}
              </div>
            )}
            {draft.type === "truefalse" && (
              <label className={styles.field}>
                Đáp án đúng
                <select
                  value={String(draft.trueFalseAnswer)}
                  onChange={(e) =>
                    setDraft((q) => ({
                      ...q,
                      trueFalseAnswer: e.target.value === "true",
                    }))
                  }
                >
                  <option value="true">Đúng</option>
                  <option value="false">Sai</option>
                </select>
              </label>
            )}
            {draft.type === "fillblank" && (
              <label className={styles.field}>
                Đáp án được chấp nhận
                <input
                  value={draft.acceptedAnswers.join(" | ")}
                  onChange={(e) =>
                    setDraft((q) => ({
                      ...q,
                      acceptedAnswers: e.target.value
                        .split("|")
                        .map((x) => x.trim()),
                    }))
                  }
                  placeholder="is | am"
                />
              </label>
            )}
            {draft.type === "matching" && (
              <div className={styles.answerEditor}>
                <strong>Các cặp nối (mỗi dòng: vế trái | vế phải)</strong>
                <textarea
                  rows={4}
                  value={draft.pairs
                    .map((p) => `${p.left} | ${p.right}`)
                    .join("\n")}
                  onChange={(e) =>
                    setDraft((q) => ({
                      ...q,
                      pairs: e.target.value.split("\n").map((line, i) => {
                        const [left = "", right = ""] = line.split("|");
                        return {
                          id: `pair-${i + 1}`,
                          left: left.trim(),
                          right: right.trim(),
                        };
                      }),
                    }))
                  }
                  placeholder={"cat | con mèo\ndog | con chó"}
                />
              </div>
            )}
            {draft.type === "ordering" && (
              <label className={styles.field}>
                Câu đúng
                <input
                  value={draft.sentence}
                  onChange={(e) =>
                    setDraft((q) => ({ ...q, sentence: e.target.value }))
                  }
                  placeholder="I like playing football"
                />
              </label>
            )}
            {draft.type === "essay" && (
              <label className={styles.field}>
                Gợi ý đáp án (không bắt buộc)
                <textarea
                  rows={2}
                  value={draft.sampleAnswer}
                  onChange={(e) =>
                    setDraft((q) => ({ ...q, sampleAnswer: e.target.value }))
                  }
                />
              </label>
            )}
            <label className={styles.field}>
              Giải thích đáp án (không bắt buộc)
              <textarea
                rows={2}
                value={draft.explanation}
                onChange={(e) =>
                  setDraft((q) => ({ ...q, explanation: e.target.value }))
                }
              />
            </label>
            <button type="button" className={styles.primary} onClick={addDraft}>
              Thêm câu hỏi vào đề
            </button>
          </div>
        )}
        {notice && (
          <p className={styles.notice} role="alert">
            {notice}
          </p>
        )}
        <div className={styles.submitRow}>
          <span>
            {selected.length + newQuestions.length} câu được chọn ·{" "}
            {classes.find((c) => c.id === classId)?.students.length ?? 0} học
            sinh nhận bài
          </span>
          <button
            type="button"
            className={styles.primary}
            disabled={saving || !classes.length}
            onClick={submit}
          >
            {saving ? "Đang giao bài..." : "Giao bài cho lớp"}
          </button>
        </div>
      </section>
    </div>
  );
}
