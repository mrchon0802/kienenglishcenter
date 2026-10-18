"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DIFFICULTY_OPTIONS, GRADE_OPTIONS, SKILL_OPTIONS, typeLabel } from "@/lib/question-types";
import type { AssignmentKind, ShowAnswers } from "@/types/assignment";
import type { Question } from "@/types/question";
import { createAssignmentAction } from "../../actions";
import { QuestionPicker } from "./QuestionPicker";
import styles from "./AssignmentForm.module.css";

interface AssignmentFormProps {
  classes: { id: string; name: string }[];
  questions: Question[]; // chỉ câu đang dùng (chưa lưu trữ)
}

const KIND_OPTIONS = [
  { value: "practice", label: "Bài luyện tập" },
  { value: "test", label: "Bài kiểm tra" },
];

const SHOW_ANSWERS_OPTIONS = [
  { value: "immediately", label: "Ngay sau khi học sinh nộp bài" },
  { value: "after_deadline", label: "Sau hạn nộp của cả lớp" },
  { value: "never", label: "Không hiện đáp án" },
];

type Errors = Partial<Record<"title" | "classId" | "dueAt" | "duration" | "questions", string>>;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function AssignmentForm({ classes, questions }: AssignmentFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<AssignmentKind>("practice");
  const [classId, setClassId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [duration, setDuration] = useState("20");
  const [showAnswers, setShowAnswers] = useState<ShowAnswers>("immediately");
  const [mode, setMode] = useState<"manual" | "random">("manual");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");

  // Quy tắc rút ngẫu nhiên
  const [ruleGrade, setRuleGrade] = useState("");
  const [ruleUnit, setRuleUnit] = useState("");
  const [ruleSkill, setRuleSkill] = useState("");
  const [ruleDifficulty, setRuleDifficulty] = useState("");
  const [ruleCount, setRuleCount] = useState("10");
  const [drawMessage, setDrawMessage] = useState("");

  const byId = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const selected = selectedIds.map((id) => byId.get(id)).filter((q): q is Question => Boolean(q));
  const totalPoints = selected.reduce((sum, q) => sum + q.points, 0);

  const unitOptions = useMemo(
    () =>
      [...new Set(questions.map((q) => q.unit))]
        .sort((a, b) => a - b)
        .map((u) => ({ value: String(u), label: `Unit ${u}` })),
    [questions],
  );

  function handleKindChange(next: AssignmentKind) {
    setKind(next);
    setShowAnswers(next === "test" ? "after_deadline" : "immediately");
  }

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setErrors((e) => ({ ...e, questions: undefined }));
  }

  function selectMany(ids: string[]) {
    setSelectedIds((prev) => [...prev, ...ids.filter((id) => !prev.includes(id))]);
    setErrors((e) => ({ ...e, questions: undefined }));
  }

  function move(index: number, delta: number) {
    setSelectedIds((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function drawRandom() {
    const count = Math.max(1, Math.floor(Number(ruleCount) || 0));
    const pool = questions.filter(
      (q) =>
        (!ruleGrade || String(q.grade) === ruleGrade) &&
        (!ruleUnit || String(q.unit) === ruleUnit) &&
        (!ruleSkill || q.skill === ruleSkill) &&
        (!ruleDifficulty || String(q.difficulty) === ruleDifficulty),
    );
    const picked = shuffle(pool).slice(0, count);
    setSelectedIds(picked.map((q) => q.id));
    setErrors((e) => ({ ...e, questions: undefined }));
    setDrawMessage(
      pool.length === 0
        ? "Không có câu hỏi nào khớp quy tắc này."
        : picked.length < count
          ? `Chỉ có ${pool.length} câu phù hợp, đã lấy hết ${picked.length} câu.`
          : `Đã rút ngẫu nhiên ${picked.length} câu. Bạn vẫn có thể thêm, bớt, đổi thứ tự bên dưới.`,
    );
  }

  function validate(): Errors {
    const next: Errors = {};
    if (!title.trim()) next.title = "Nhập tên bài.";
    if (!classId) next.classId = "Chọn lớp được giao.";
    if (!dueAt) next.dueAt = "Chọn hạn nộp.";
    if (kind === "test" && !(Number(duration) > 0)) next.duration = "Nhập thời gian làm bài (phút).";
    if (selectedIds.length === 0) next.questions = "Chọn ít nhất 1 câu hỏi.";
    return next;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setServerError("");
    if (Object.keys(found).length > 0) return;

    startTransition(async () => {
      const response = await createAssignmentAction({
        title,
        kind,
        classId,
        dueAt,
        durationMinutes: kind === "test" ? Number(duration) : null,
        showAnswers,
        questionIds: selectedIds,
      });
      if (response.ok) router.push(`/admin/assignments/${response.id}`);
      else setServerError(response.error);
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <Card title="Thông tin bài">
        <div className={styles.stack}>
          <div className={styles.fields}>
            <Input label="Tên bài" value={title} error={errors.title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Kiểm tra Unit 5" />
            <Select label="Loại bài" value={kind} options={KIND_OPTIONS} onChange={(e) => handleKindChange(e.target.value as AssignmentKind)} />
            <Select label="Giao cho lớp" placeholder="Chọn lớp" value={classId} error={errors.classId} options={classes.map((c) => ({ value: c.id, label: `Lớp ${c.name}` }))} onChange={(e) => setClassId(e.target.value)} />
            <Input label="Hạn nộp" type="datetime-local" value={dueAt} error={errors.dueAt} onChange={(e) => setDueAt(e.target.value)} />
            {kind === "test" ? (
              <Input label="Thời gian làm bài (phút)" type="number" min={1} value={duration} error={errors.duration} onChange={(e) => setDuration(e.target.value)} />
            ) : null}
            <Select label="Khi nào hiện đáp án" value={showAnswers} options={SHOW_ANSWERS_OPTIONS} onChange={(e) => setShowAnswers(e.target.value as ShowAnswers)} />
          </div>
          <p className={styles.hint}>
            {kind === "test"
              ? "Bài kiểm tra: mỗi học sinh làm 1 lần, có đếm ngược, khóa sau hạn nộp."
              : "Bài luyện tập: làm lại không giới hạn, điểm cao nhất được ghi nhận, nộp trễ vẫn được nhưng có gắn nhãn."}
          </p>
        </div>
      </Card>

      <Card title="Chọn câu hỏi từ ngân hàng">
        <div className={styles.stack}>
          <div className={styles.modes} role="group" aria-label="Cách chọn câu hỏi">
            <button type="button" className={`${styles.mode} ${mode === "manual" ? styles.modeOn : ""}`} aria-pressed={mode === "manual"} onClick={() => setMode("manual")}>
              Chọn tay
            </button>
            <button type="button" className={`${styles.mode} ${mode === "random" ? styles.modeOn : ""}`} aria-pressed={mode === "random"} onClick={() => setMode("random")}>
              Rút ngẫu nhiên
            </button>
          </div>

          {mode === "manual" ? (
            <QuestionPicker questions={questions} selectedIds={selectedIds} onToggle={toggle} onSelectMany={selectMany} />
          ) : (
            <div className={styles.stack}>
              <p className={styles.hint}>
                Đặt quy tắc rồi bấm rút. Mỗi lần rút sẽ thay thế danh sách đang chọn bằng một bộ câu hỏi mới.
              </p>
              <div className={styles.fields}>
                <Select label="Lớp" placeholder="Tất cả" options={GRADE_OPTIONS} value={ruleGrade} onChange={(e) => setRuleGrade(e.target.value)} />
                <Select label="Unit" placeholder="Tất cả" options={unitOptions} value={ruleUnit} onChange={(e) => setRuleUnit(e.target.value)} />
                <Select label="Kỹ năng" placeholder="Tất cả" options={SKILL_OPTIONS} value={ruleSkill} onChange={(e) => setRuleSkill(e.target.value)} />
                <Select label="Độ khó" placeholder="Tất cả" options={DIFFICULTY_OPTIONS} value={ruleDifficulty} onChange={(e) => setRuleDifficulty(e.target.value)} />
                <Input label="Số câu cần rút" type="number" min={1} value={ruleCount} onChange={(e) => setRuleCount(e.target.value)} />
              </div>
              <div>
                <Button variant="primary" onClick={drawRandom}>
                  Rút ngẫu nhiên
                </Button>
              </div>
              {drawMessage ? (
                <p className={styles.hint} role="status">
                  {drawMessage}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </Card>

      <Card title={`Câu đã chọn (${selected.length} câu · ${totalPoints} điểm)`}>
        {errors.questions ? (
          <p className={styles.error} role="alert">
            {errors.questions}
          </p>
        ) : null}
        {selected.length === 0 ? (
          <p className={styles.hint}>Chưa chọn câu hỏi nào.</p>
        ) : (
          <ol className={styles.selectedList}>
            {selected.map((q, index) => (
              <li key={q.id} className={styles.selectedRow}>
                <span className={styles.selectedText}>
                  {index + 1}. {q.prompt}
                </span>
                <Badge>{typeLabel(q.type)}</Badge>
                <div className={styles.rowActions}>
                  <Button onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Đưa câu ${index + 1} lên`}>
                    Lên
                  </Button>
                  <Button onClick={() => move(index, 1)} disabled={index === selected.length - 1} aria-label={`Đưa câu ${index + 1} xuống`}>
                    Xuống
                  </Button>
                  <Button onClick={() => toggle(q.id)} aria-label={`Bỏ câu ${index + 1}`}>
                    Bỏ
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {serverError ? (
        <p className={styles.errorBox} role="alert">
          {serverError}
        </p>
      ) : null}

      <div className={styles.actions}>
        <Button href="/admin/assignments">Hủy</Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Đang giao bài..." : "Giao bài cho lớp"}
        </Button>
      </div>
    </form>
  );
}
