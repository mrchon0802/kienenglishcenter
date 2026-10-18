"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Question } from "@/types/question";
import type { Assignment, AssignmentKind, AssignmentStatus } from "@/types/assignment";
import { getQuestions } from "@/mocks/questions";
import { saveAssignment, updateAssignmentStatus } from "@/mocks/assignments";
import { snapshotQuestions, formatDateTime, assignmentKindLabel } from "@/lib/assignment-utils";
import { QUESTION_TYPE_OPTIONS, SKILL_OPTIONS, newId } from "@/lib/question-types";
import styles from "./AssignmentsView.module.css";

const CLASS_OPTIONS = [
  { id: "class-1a", name: "Lớp 1A", grade: 1 }, { id: "class-2a", name: "Lớp 2A", grade: 2 },
  { id: "class-3a", name: "Lớp 3A", grade: 3 }, { id: "class-4a", name: "Lớp 4A", grade: 4 },
  { id: "class-5a", name: "Lớp 5A", grade: 5 }, { id: "class-6a", name: "Lớp 6A", grade: 6 },
  { id: "class-7a", name: "Lớp 7A", grade: 7 }, { id: "class-8a", name: "Lớp 8A", grade: 8 },
  { id: "class-9a", name: "Lớp 9A", grade: 9 },
];
const today = "2026-10-17";
const initialForm = {
  title: "", description: "", kind: "practice" as AssignmentKind, grade: "4", book: "Global Success", unit: "",
  selectionMode: "manual" as "manual" | "random", dueAt: "2026-10-24T23:59", durationMinutes: "",
  maxAttempts: "", allowLateSubmission: true, showAnswers: "immediately" as Assignment["showAnswers"],
  randomCount: "10", difficulty: "all", skill: "all", classIds: ["class-4a"] as string[], questionIds: [] as string[],
};

export function AssignmentsView() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void getQuestions().then((items) => setQuestions(items));
    void import("@/mocks/assignments").then((module) => module.getAssignments()).then(setAssignments);
  }, []);

  const eligibleQuestions = useMemo(() => questions.filter((q) => q.status === "active" && q.grade === Number(form.grade)
    && (!form.unit || q.unit === Number(form.unit))
    && (form.difficulty === "all" || q.difficulty === Number(form.difficulty))
    && (form.skill === "all" || q.skill === form.skill)), [questions, form.grade, form.unit, form.difficulty, form.skill]);

  const visibleAssignments = assignments.filter((item) => (filter === "all" || item.status === filter)
    && `${item.title} ${item.description}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")));

  function setField<K extends keyof typeof initialForm>(key: K, value: (typeof initialForm)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function toggleQuestion(id: string) {
    setForm((current) => ({ ...current, questionIds: current.questionIds.includes(id)
      ? current.questionIds.filter((item) => item !== id) : [...current.questionIds, id] }));
  }
  function toggleClass(id: string) {
    setForm((current) => ({ ...current, classIds: current.classIds.includes(id)
      ? current.classIds.filter((item) => item !== id) : [...current.classIds, id] }));
  }
  function resetForm() { setForm(initialForm); setError(""); setCreating(false); }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    if (!form.title.trim()) return setError("Vui lòng nhập tên bài.");
    if (!form.classIds.length) return setError("Chọn ít nhất một lớp được giao bài.");
    if (!form.dueAt) return setError("Vui lòng chọn hạn nộp.");
    let selectedIds = [...form.questionIds];
    if (form.selectionMode === "random") {
      const count = Math.max(1, Number(form.randomCount) || 1);
      if (eligibleQuestions.length < count) return setError(`Bộ lọc hiện chỉ có ${eligibleQuestions.length} câu; hãy giảm số câu hoặc nới bộ lọc.`);
      // Deterministic selection for predictable mock behavior; production should randomize on the server.
      selectedIds = eligibleQuestions.slice(0, count).map((q) => q.id);
    }
    if (!selectedIds.length) return setError("Hãy chọn câu hỏi hoặc chuyển sang chế độ rút câu tự động.");
    const selected = questions.filter((q) => selectedIds.includes(q.id));
    if (selected.some((q) => q.type === "essay") && form.kind === "test") {
      setNotice("Lưu ý: bài có câu tự luận cần giáo viên chấm tay.");
    }
    const assignment: Assignment = {
      id: `as-${newId()}`, title: form.title.trim(), description: form.description.trim(), kind: form.kind,
      classIds: [...form.classIds], grade: Number(form.grade), book: form.book.trim() || "Sách giáo khoa", unit: form.unit ? Number(form.unit) : null,
      selectionMode: form.selectionMode, questionIds: selectedIds, questions: snapshotQuestions(questions, selectedIds), dueAt: form.dueAt,
      durationMinutes: form.kind === "test" && form.durationMinutes ? Math.max(1, Number(form.durationMinutes)) : null,
      maxAttempts: form.kind === "test" ? 1 : null, allowLateSubmission: form.kind === "practice" ? form.allowLateSubmission : false,
      showAnswers: form.kind === "practice" ? "immediately" : form.showAnswers, status: "published", createdAt: today,
    };
    const updated = await saveAssignment(assignment); setAssignments(updated); setCreating(false); setForm(initialForm);
    setNotice(`Đã tạo “${assignment.title}” với ${selected.length} câu hỏi. Dữ liệu hiện được lưu mock trong bộ nhớ phiên.`);
  }

  async function changeStatus(id: string, status: AssignmentStatus) {
    setAssignments(await updateAssignmentStatus(id, status));
  }

  return <div className={styles.root}>
    <div className={styles.topline}>
      <div><p className={styles.intro}>Tạo bài từ ngân hàng câu hỏi, giao theo lớp và thiết lập hạn nộp.</p><div className={styles.stats}>
        <div className={styles.stat}><span>Tổng bài</span><strong>{assignments.length}</strong></div>
        <div className={styles.stat}><span>Đang giao</span><strong>{assignments.filter((a) => a.status === "published").length}</strong></div>
        <div className={styles.stat}><span>Câu hỏi đang dùng được</span><strong>{questions.filter((q) => q.status === "active").length}</strong></div>
      </div></div>
      <button type="button" className={styles.primary} onClick={() => { setCreating((v) => !v); setError(""); }}>＋ Tạo bài mới</button>
    </div>

    {notice && <p className={styles.notice} role="status">{notice}</p>}
    {creating && <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formHeader}><div><h2>Tạo bài tập / bài kiểm tra</h2><p>Câu hỏi được sao chép vào bài tại thời điểm tạo.</p></div><button type="button" className={styles.secondary} onClick={resetForm}>Đóng</button></div>
      <div className={styles.formGrid}>
        <label className={styles.field}>Tên bài <span>*</span><input required value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="Ví dụ: Kiểm tra Unit 4" /></label>
        <label className={styles.field}>Loại bài<select value={form.kind} onChange={(e) => { const kind = e.target.value as AssignmentKind; setField("kind", kind); if (kind === "test") setField("showAnswers", "after_due"); else setField("showAnswers", "immediately"); }}><option value="practice">Bài luyện tập</option><option value="test">Bài kiểm tra</option></select></label>
        <label className={styles.field}>Khối lớp<select value={form.grade} onChange={(e) => { setField("grade", e.target.value); setField("questionIds", []); setField("classIds", []); }}><option value="">Chọn khối</option>{Array.from({ length: 9 }, (_, i) => <option key={i + 1} value={String(i + 1)}>Lớp {i + 1}</option>)}</select></label>
        <label className={styles.field}>Bộ sách<input value={form.book} onChange={(e) => setField("book", e.target.value)} placeholder="Global Success" /></label>
        <label className={styles.field}>Unit (không bắt buộc)<input type="number" min="1" value={form.unit} onChange={(e) => { setField("unit", e.target.value); setField("questionIds", []); }} placeholder="Tất cả unit" /></label>
        <label className={styles.field}>Hạn nộp <span>*</span><input type="datetime-local" required value={form.dueAt} onChange={(e) => setField("dueAt", e.target.value)} /></label>
        {form.kind === "test" && <label className={styles.field}>Thời lượng (phút)<input type="number" min="1" max="300" value={form.durationMinutes} onChange={(e) => setField("durationMinutes", e.target.value)} placeholder="Ví dụ: 45" /></label>}
        <label className={styles.field}>Mô tả<textarea rows={2} value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="Hướng dẫn học sinh (không bắt buộc)" /></label>
      </div>
      <fieldset className={styles.fieldset}><legend>Giao cho lớp</legend><div className={styles.checkGrid}>{CLASS_OPTIONS.filter((c) => c.grade === Number(form.grade)).map((c) => <label key={c.id} className={styles.check}><input type="checkbox" checked={form.classIds.includes(c.id)} onChange={() => toggleClass(c.id)} />{c.name}</label>)}</div><small>Danh sách lớp đang là dữ liệu mẫu, chưa kết nối danh sách lớp thực tế.</small></fieldset>
      <fieldset className={styles.fieldset}><legend>Chọn câu hỏi</legend><div className={styles.modeRow}><label className={styles.check}><input type="radio" checked={form.selectionMode === "manual"} onChange={() => setField("selectionMode", "manual")} /> Chọn thủ công</label><label className={styles.check}><input type="radio" checked={form.selectionMode === "random"} onChange={() => setField("selectionMode", "random")} /> Rút câu theo bộ lọc</label></div>
        {form.selectionMode === "random" ? <div className={styles.filterGrid}><label className={styles.field}>Số câu<input type="number" min="1" max="100" value={form.randomCount} onChange={(e) => setField("randomCount", e.target.value)} /></label><label className={styles.field}>Độ khó<select value={form.difficulty} onChange={(e) => { setField("difficulty", e.target.value); setField("questionIds", []); }}><option value="all">Tất cả</option><option value="1">Dễ</option><option value="2">Trung bình</option><option value="3">Khó</option></select></label><label className={styles.field}>Kỹ năng<select value={form.skill} onChange={(e) => { setField("skill", e.target.value); setField("questionIds", []); }}><option value="all">Tất cả</option>{SKILL_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label><p className={styles.matchCount}>Có {eligibleQuestions.length} câu phù hợp với bộ lọc.</p></div> : <>
          <div className={styles.questionTools}><span>{form.questionIds.length} câu đã chọn</span><span>{eligibleQuestions.length} câu phù hợp</span><button type="button" className={styles.textButton} onClick={() => setField("questionIds", eligibleQuestions.map((q) => q.id))}>Chọn tất cả câu phù hợp</button><button type="button" className={styles.textButton} onClick={() => setField("questionIds", [])}>Bỏ chọn</button></div>
          <div className={styles.questionList}>{eligibleQuestions.map((q) => <label className={styles.question} key={q.id}><input type="checkbox" checked={form.questionIds.includes(q.id)} onChange={() => toggleQuestion(q.id)} /><span className={styles.questionText}><strong>{q.prompt || "(Chưa có nội dung câu hỏi)"}</strong><small>{QUESTION_TYPE_OPTIONS.find((t) => t.value === q.type)?.label ?? q.type} · Unit {q.unit} · {q.points} điểm · {q.skill}</small></span></label>)}{eligibleQuestions.length === 0 && <p className={styles.empty}>Không có câu hỏi đang hoạt động phù hợp. Hãy kiểm tra khối lớp / Unit trong ngân hàng câu hỏi.</p>}</div>
        </>}
      </fieldset>
      {form.kind === "practice" ? <fieldset className={styles.fieldset}><legend>Quy tắc luyện tập</legend><label className={styles.check}><input type="checkbox" checked={form.allowLateSubmission} onChange={(e) => setField("allowLateSubmission", e.target.checked)} /> Cho phép nộp trễ (gắn nhãn trễ, không tự trừ điểm)</label><p className={styles.help}>Có thể làm lại không giới hạn; hiện đáp án ngay sau khi nộp. Bản mock chưa có màn hình học sinh để thực thi các quy tắc này.</p></fieldset> : <fieldset className={styles.fieldset}><legend>Quy tắc bài kiểm tra</legend><label className={styles.field}>Hiện đáp án<select value={form.showAnswers} onChange={(e) => setField("showAnswers", e.target.value as Assignment["showAnswers"])}><option value="after_due">Sau hạn nộp của lớp</option><option value="never">Không hiện đáp án</option></select></label><p className={styles.help}>Bài kiểm tra giới hạn một lần làm; khóa sau hạn. Mở lại riêng từng học sinh và đồng hồ đếm ngược sẽ triển khai ở khu vực học sinh.</p></fieldset>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.formFooter}><span>Trạng thái sau khi tạo: <strong>Đang giao</strong></span><button type="button" className={styles.secondary} onClick={resetForm}>Hủy</button><button type="submit" className={styles.primary}>Tạo và giao bài</button></div>
    </form>}

    <section className={styles.listPanel}><div className={styles.listHeader}><div><h2>Danh sách bài đã tạo</h2><p>Quản lý bài luyện tập và bài kiểm tra.</p></div><div className={styles.listFilters}><input aria-label="Tìm bài" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm tên bài..."/><select aria-label="Lọc trạng thái" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">Tất cả trạng thái</option><option value="published">Đang giao</option><option value="draft">Bản nháp</option><option value="archived">Đã lưu trữ</option></select></div></div>
      {visibleAssignments.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Tên bài</th><th>Loại</th><th>Lớp</th><th>Số câu</th><th>Hạn nộp</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{visibleAssignments.map((item) => <tr key={item.id}><td><strong>{item.title}</strong>{item.description && <small>{item.description}</small>}</td><td>{assignmentKindLabel(item.kind)}</td><td>{item.classIds.map((id) => CLASS_OPTIONS.find((c) => c.id === id)?.name ?? id).join(", ")}</td><td>{item.questions.length || item.questionIds.length}</td><td>{formatDateTime(item.dueAt)}</td><td><span className={`${styles.status} ${item.status === "published" ? styles.published : item.status === "draft" ? styles.draft : styles.archived}`}>{item.status === "published" ? "Đang giao" : item.status === "draft" ? "Bản nháp" : "Đã lưu trữ"}</span></td><td><div className={styles.actions}>{item.status !== "archived" ? <button type="button" className={styles.textButton} onClick={() => void changeStatus(item.id, "archived")}>Lưu trữ</button> : <button type="button" className={styles.textButton} onClick={() => void changeStatus(item.id, "published")}>Khôi phục</button>}</div></td></tr>)}</tbody></table></div> : <div className={styles.empty}>Chưa có bài phù hợp. Hãy tạo bài mới để bắt đầu.</div>}
    </section>
  </div>;
}
