"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import {
  GRADE_OPTIONS,
  QUESTION_TYPE_OPTIONS,
  SKILL_OPTIONS,
  skillLabel,
  summarizeAnswer,
  typeLabel,
} from "@/lib/question-types";
import { normalizeText } from "@/lib/text";
import { setQuestionStatusAction, shareQuestionAction } from "../../actions";
import type { Teacher } from "@/types/teacher";
import type { Question } from "@/types/question";
import styles from "./QuestionBankView.module.css";

const PAGE_SIZE = 10;

export function QuestionBankView({ questions, teachers }: { questions: Question[]; teachers: Teacher[] }) {
  const [items, setItems] = useState(questions);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [grade, setGrade] = useState("");
  const [unit, setUnit] = useState("");
  const [skill, setSkill] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [sharingQuestion, setSharingQuestion] = useState<Question | null>(null);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [shareMessage, setShareMessage] = useState("");
  const [sharePending, setSharePending] = useState(false);

  const unitOptions = useMemo(
    () =>
      [...new Set(items.map((q) => q.unit))]
        .sort((a, b) => a - b)
        .map((u) => ({ value: String(u), label: `Unit ${u}` })),
    [items],
  );

  const filtered = useMemo(() => {
    const keyword = normalizeText(search);
    return items.filter((q) => {
      if (!showArchived && q.status === "archived") return false;
      if (type && q.type !== type) return false;
      if (grade && String(q.grade) !== grade) return false;
      if (unit && String(q.unit) !== unit) return false;
      if (skill && q.skill !== skill) return false;
      return !keyword || normalizeText(q.prompt).includes(keyword);
    });
  }, [items, search, type, grade, unit, skill, showArchived]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);
  const hasFilter = Boolean(search || type || grade || unit || skill);

  function filterSetter(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(1);
    };
  }

  function resetFilters() {
    setSearch("");
    setType("");
    setGrade("");
    setUnit("");
    setSkill("");
    setPage(1);
  }

  function openShare(question: Question) {
    setSharingQuestion(question);
    setSelectedTeacherIds(question.sharedWithTeacherIds ?? []);
    setShareMessage("");
  }

  async function saveShare() {
    if (!sharingQuestion) return;
    setSharePending(true);
    const result = await shareQuestionAction(sharingQuestion.id, selectedTeacherIds);
    setSharePending(false);
    if (!result.ok) { setShareMessage(result.error); return; }
    setItems((prev) => prev.map((item) => item.id === sharingQuestion.id ? { ...item, sharedWithTeacherIds: [...selectedTeacherIds] } : item));
    setShareMessage(selectedTeacherIds.length ? "Đã cập nhật chia sẻ câu hỏi." : "Đã thu hồi tất cả quyền chia sẻ.");
    setSharingQuestion(null);
  }

  function toggleArchive(id: string) {
    const target = items.find((q) => q.id === id);
    if (!target) return;
    const next = target.status === "archived" ? "active" : "archived";
    setItems((prev) => prev.map((q) => (q.id === id ? { ...q, status: next } : q))); // cập nhật ngay trên màn hình
    void setQuestionStatusAction(id, next);
  }

  return (
    <Card>
      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Input
            label="Tìm câu hỏi"
            type="search"
            placeholder="Gõ một phần nội dung câu hỏi"
            value={search}
            onChange={(e) => filterSetter(setSearch)(e.target.value)}
          />
        </div>
        <Select label="Dạng câu" placeholder="Tất cả" options={QUESTION_TYPE_OPTIONS.map((t) => ({ value: t.value, label: t.label }))} value={type} onChange={(e) => filterSetter(setType)(e.target.value)} />
        <Select label="Lớp" placeholder="Tất cả" options={GRADE_OPTIONS} value={grade} onChange={(e) => filterSetter(setGrade)(e.target.value)} />
        <Select label="Unit" placeholder="Tất cả" options={unitOptions} value={unit} onChange={(e) => filterSetter(setUnit)(e.target.value)} />
        <Select label="Kỹ năng" placeholder="Tất cả" options={SKILL_OPTIONS} value={skill} onChange={(e) => filterSetter(setSkill)(e.target.value)} />
      </div>
      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => {
            setShowArchived(e.target.checked);
            setPage(1);
          }}
        />
        Hiện cả câu đã lưu trữ
      </label>

      {visible.length === 0 ? (
        <EmptyState
          title="Không có câu hỏi nào phù hợp"
          description="Thử đổi bộ lọc, hoặc tạo câu hỏi mới."
        >
          {hasFilter ? <Button onClick={resetFilters}>Xóa bộ lọc</Button> : null}
        </EmptyState>
      ) : (
        <>
          <div className={styles.desktopTable}>
          <Table>
            <thead>
              <tr>
                <th scope="col">Câu hỏi</th>
                <th scope="col">Dạng</th>
                <th scope="col">Lớp</th>
                <th scope="col">Người tạo</th>
                <th scope="col">Đã chia sẻ</th>
                <th scope="col">Lesson</th>
                <th scope="col">Unit</th>
                <th scope="col">Kỹ năng</th>
                <th scope="col">Đáp án</th>
                <th scope="col">Điểm</th>
                <th scope="col">
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((q) => (
                <tr key={q.id}>
                  <td>
                    <span className={styles.truncate} title={q.prompt}>
                      {q.prompt}
                    </span>
                  </td>
                  <td>
                    <Badge tone={q.status === "archived" ? "amber" : "teal"}>
                      {q.status === "archived" ? "Đã lưu trữ" : typeLabel(q.type)}
                    </Badge>
                  </td>
                  <td>{q.grade}</td>
                  <td>{teachers.find((teacher) => teacher.id === q.createdBy)?.fullName ?? (q.createdBy ?? "Dữ liệu cũ")}</td>
                  <td>{(q.sharedWithTeacherIds ?? []).length}</td>
                  <td>{q.lessonId ?? "Chưa liên kết"}</td>
                  <td>{q.unit}</td>
                  <td>{skillLabel(q.skill)}</td>
                  <td>
                    <span className={styles.truncateSmall} title={summarizeAnswer(q)}>
                      {summarizeAnswer(q)}
                    </span>
                  </td>
                  <td>{q.points}</td>
                  <td>
                    <div className={styles.actions}>
                      <Link href={`/admin/question-bank/${q.id}/edit`}>Sửa</Link>
                      <Button onClick={() => openShare(q)}>Chia sẻ</Button>
                      <Button onClick={() => toggleArchive(q.id)}>
                        {q.status === "archived" ? "Khôi phục" : "Lưu trữ"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          </div>
          <div className={styles.mobileCards} aria-label="Danh sách câu hỏi dạng thẻ">
            {visible.map((q) => (
              <article className={styles.questionCard} key={`mobile-${q.id}`}>
                <div className={styles.questionCardHead}>
                  <Badge tone={q.status === "archived" ? "amber" : "teal"}>
                    {q.status === "archived" ? "Đã lưu trữ" : typeLabel(q.type)}
                  </Badge>
                  <strong>{q.points} điểm</strong>
                </div>
                <p className={styles.questionPrompt}>{q.prompt}</p>
                <dl className={styles.questionMeta}>
                  <div><dt>Lớp</dt><dd>{q.grade}</dd></div>
                  <div><dt>Unit</dt><dd>{q.unit}</dd></div>
                  <div><dt>Kỹ năng</dt><dd>{skillLabel(q.skill)}</dd></div>
                  <div><dt>Chia sẻ</dt><dd>{(q.sharedWithTeacherIds ?? []).length} giáo viên</dd></div>
                </dl>
                <p className={styles.answerPreview}><strong>Đáp án:</strong> {summarizeAnswer(q)}</p>
                <div className={styles.mobileActions}>
                  <Link href={`/admin/question-bank/${q.id}/edit`}>Sửa</Link>
                  <Button onClick={() => openShare(q)}>Chia sẻ</Button>
                  <Button onClick={() => toggleArchive(q.id)}>
                    {q.status === "archived" ? "Khôi phục" : "Lưu trữ"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
          <div className={styles.footer}>
            <p className={styles.count} role="status">
              Hiển thị {start + 1} - {start + visible.length} / {filtered.length} câu hỏi
            </p>
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}
      {sharingQuestion ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSharingQuestion(null); }}>
          <section className={styles.shareModal} role="dialog" aria-modal="true" aria-labelledby="share-question-title">
            <div className={styles.modalHead}>
              <div><h2 id="share-question-title">Chia sẻ câu hỏi</h2><p>{sharingQuestion.prompt}</p></div>
              <button type="button" className={styles.closeButton} onClick={() => setSharingQuestion(null)} aria-label="Đóng">×</button>
            </div>
            <p className={styles.modalHint}>Chọn giáo viên được xem và sử dụng câu hỏi này. Họ không thể sửa bản gốc.</p>
            <div className={styles.teacherChoices}>
              {teachers.filter((teacher) => teacher.employmentStatus === "working").map((teacher) => (
                <label key={teacher.id} className={styles.teacherChoice}>
                  <input type="checkbox" checked={selectedTeacherIds.includes(teacher.id)} onChange={(event) => setSelectedTeacherIds((prev) => event.target.checked ? [...prev, teacher.id] : prev.filter((id) => id !== teacher.id))} />
                  <span><strong>{teacher.fullName}</strong><small>{teacher.teacherCode} · {teacher.specialization}</small></span>
                </label>
              ))}
            </div>
            {shareMessage ? <p role="status" className={styles.shareMessage}>{shareMessage}</p> : null}
            <div className={styles.modalActions}>
              <Button onClick={() => setSelectedTeacherIds([])}>Thu hồi tất cả</Button>
              <Button onClick={() => setSharingQuestion(null)}>Hủy</Button>
              <Button variant="primary" disabled={sharePending} onClick={saveShare}>{sharePending ? "Đang lưu..." : "Lưu chia sẻ"}</Button>
            </div>
          </section>
        </div>
      ) : null}
    </Card>
  );
}
