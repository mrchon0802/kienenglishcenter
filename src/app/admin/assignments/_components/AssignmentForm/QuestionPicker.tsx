"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { GRADE_OPTIONS, QUESTION_TYPE_OPTIONS, SKILL_OPTIONS, typeLabel } from "@/lib/question-types";
import { normalizeText } from "@/lib/text";
import type { Question } from "@/types/question";
import styles from "./AssignmentForm.module.css";

interface QuestionPickerProps {
  questions: Question[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectMany: (ids: string[]) => void;
}

/** Chọn tay: lọc ngân hàng câu hỏi và tích chọn từng câu. */
export function QuestionPicker({ questions, selectedIds, onToggle, onSelectMany }: QuestionPickerProps) {
  const [search, setSearch] = useState("");
  const [grade, setGrade] = useState("");
  const [unit, setUnit] = useState("");
  const [skill, setSkill] = useState("");
  const [type, setType] = useState("");

  const unitOptions = useMemo(
    () =>
      [...new Set(questions.map((q) => q.unit))]
        .sort((a, b) => a - b)
        .map((u) => ({ value: String(u), label: `Unit ${u}` })),
    [questions],
  );

  const visible = useMemo(() => {
    const keyword = normalizeText(search);
    return questions.filter((q) => {
      if (grade && String(q.grade) !== grade) return false;
      if (unit && String(q.unit) !== unit) return false;
      if (skill && q.skill !== skill) return false;
      if (type && q.type !== type) return false;
      return !keyword || normalizeText(q.prompt).includes(keyword);
    });
  }, [questions, search, grade, unit, skill, type]);

  return (
    <div className={styles.stack}>
      <div className={styles.filters}>
        <Input label="Tìm câu hỏi" type="search" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select label="Lớp" placeholder="Tất cả" options={GRADE_OPTIONS} value={grade} onChange={(e) => setGrade(e.target.value)} />
        <Select label="Unit" placeholder="Tất cả" options={unitOptions} value={unit} onChange={(e) => setUnit(e.target.value)} />
        <Select label="Kỹ năng" placeholder="Tất cả" options={SKILL_OPTIONS} value={skill} onChange={(e) => setSkill(e.target.value)} />
        <Select label="Dạng câu" placeholder="Tất cả" options={QUESTION_TYPE_OPTIONS.map((t) => ({ value: t.value, label: t.label }))} value={type} onChange={(e) => setType(e.target.value)} />
      </div>

      <div className={styles.pickerHead}>
        <p className={styles.hint} role="status">
          {visible.length} câu phù hợp
        </p>
        <Button onClick={() => onSelectMany(visible.map((q) => q.id))} disabled={visible.length === 0}>
          Chọn tất cả {visible.length} câu đang hiện
        </Button>
      </div>

      {visible.length === 0 ? (
        <p className={styles.hint}>Không có câu hỏi nào phù hợp bộ lọc.</p>
      ) : (
        <ul className={styles.pickList}>
          {visible.map((q) => (
            <li key={q.id}>
              <label className={styles.pickRow}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(q.id)}
                  onChange={() => onToggle(q.id)}
                />
                <span className={styles.pickText}>{q.prompt}</span>
                <Badge>{typeLabel(q.type)}</Badge>
                <span className={styles.pickMeta}>
                  Lớp {q.grade} · Unit {q.unit}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
