"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSessionCompletionAction, publishHomeworkAfterSessionAction } from "./actions";
import type { TeacherSessionCompletion, TeacherSessionCompletionInput } from "@/types/teacher-session-completion";
import type { Curriculum } from "@/types/curriculum";
import type { Question } from "@/types/question";
import { createEmptyQuestion, validateQuestion } from "@/lib/question-types";
import styles from "./completion.module.css";

type BankQuestion = Pick<Question, "id" | "prompt" | "type" | "points" | "status">;
export function CompletionForm({ classId, sessionId, topic, initial, curriculum, bankQuestions, existingAssignmentId }: { classId: string; sessionId: string; date: string; topic: string; initial: TeacherSessionCompletion | null; curriculum: Curriculum | null; bankQuestions: BankQuestion[]; existingAssignmentId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ lessonPlanId: initial?.lessonPlanId ?? "", actualTopic: initial?.actualTopic ?? topic, completedContent: initial?.completedContent ?? "", homework: initial?.homework ?? "", nextLesson: initial?.nextLesson ?? "", notes: initial?.notes ?? "", actualDuration: String(initial?.actualDuration ?? 40) });
  const [selectedLessonId, setSelectedLessonId] = useState(initial?.curriculumLessonId ?? "");
  const [confirmLesson, setConfirmLesson] = useState(Boolean(initial?.curriculumLessonCompleted));
  const [enabled, setEnabled] = useState(Boolean(existingAssignmentId));
  const [title, setTitle] = useState("Bài tập sau buổi học – " + topic);
  const [dueDays, setDueDays] = useState("2");
  const [selected, setSelected] = useState<string[]>([]);
  const [draftPrompt, setDraftPrompt] = useState("");
  const [draftOptions, setDraftOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [newQuestions, setNewQuestions] = useState<Question[]>([]);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const activeQuestions = useMemo(() => bankQuestions.filter((q) => q.status === "active"), [bankQuestions]);
  function update(key: keyof typeof form, value: string) { setForm((old) => ({ ...old, [key]: value })); }
  function addQuestion() {
    const q = createEmptyQuestion("mcq");
    q.prompt = draftPrompt.trim();
    q.options = draftOptions.map((text, i) => ({ id: `opt-${i + 1}`, text: text.trim() }));
    q.correctOptionIds = [`opt-${correct + 1}`];
    q.grade = 3;
    const errors = validateQuestion(q);
    if (Object.keys(errors).length) { setMessage(Object.values(errors)[0] ?? "Câu hỏi chưa hợp lệ."); return; }
    setNewQuestions((items) => [...items, { ...q, id: `draft-homework-${items.length + 1}` }]);
    setDraftPrompt(""); setDraftOptions(["", "", "", ""]); setCorrect(0); setMessage("Đã thêm câu hỏi mới vào bài tập.");
  }
  const selectedUnit = curriculum?.units.find((unit) => unit.lessons.some((lesson) => lesson.id === selectedLessonId));
  function completionInput(): TeacherSessionCompletionInput {
    const lesson = selectedUnit?.lessons.find((item) => item.id === selectedLessonId);
    return {
      classId, sessionId, ...form, actualDuration: Number(form.actualDuration),
      curriculumId: curriculum?.id,
      curriculumUnitId: selectedUnit?.id,
      curriculumLessonId: lesson?.id,
      curriculumLessonTitle: lesson?.title,
      curriculumLessonCompleted: Boolean(lesson && confirmLesson),
    };
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    startTransition(async () => {
      if (enabled) {
        const now = new Date(); now.setDate(now.getDate() + Number(dueDays));
        const result = await publishHomeworkAfterSessionAction(completionInput(), { title, dueAt: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}T23:59`, questionIds: selected, newQuestions });
        if (!result.ok) { setMessage(result.error); return; }
        setMessage(result.alreadyPublished ? `Buổi học đã được giao bài trước đó (mã ${result.assignmentId}). Không tạo trùng.` : `Đã hoàn thành buổi học và giao bài thành công (mã ${result.assignmentId}). Học sinh đã nhận thông báo trong ứng dụng.`);
        router.refresh();
        return;
      }
      const result = await saveSessionCompletionAction(completionInput());
      setMessage(result.ok ? "Đã lưu biên bản hoàn thành buổi học." : result.error);
      router.refresh();
    });
  }
  return <form className={styles.form} onSubmit={submit}>
    {curriculum ? <section className={styles.curriculumBox}>
      <div><h2>Nội dung giáo trình</h2><p>Giáo trình: {curriculum.title}</p></div>
      <label>Chọn Unit / Lesson
        <select value={selectedLessonId} onChange={(event) => { setSelectedLessonId(event.target.value); setConfirmLesson(false); }}>
          <option value="">-- Chọn Lesson đã dạy --</option>
          {curriculum.units.map((unit) => <optgroup key={unit.id} label={unit.title}>
            {unit.lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title} · {lesson.durationMinutes} phút</option>)}
          </optgroup>)}
        </select>
      </label>
      {selectedUnit && selectedLessonId ? <div className={styles.lessonInfo}>
        <strong>{selectedUnit.title}</strong>
        <p>{selectedUnit.lessons.find((lesson) => lesson.id === selectedLessonId)?.objectives || "Chưa có mục tiêu học tập."}</p>
      </div> : null}
      <label className={styles.confirmLesson}>
        <input type="checkbox" checked={confirmLesson} disabled={!selectedLessonId} onChange={(event) => setConfirmLesson(event.target.checked)} />
        Tôi xác nhận Lesson đã được giảng dạy hoàn tất
      </label>
      <p className={styles.helper}>Việc điểm danh hoặc lưu biên bản không tự động hoàn thành Lesson. Chỉ khi chọn Lesson và tích xác nhận, tiến độ giáo trình mới được cập nhật.</p>
    </section> : <p className={styles.helper}>Lớp này chưa được Admin gán giáo trình. Bạn vẫn có thể lưu biên bản buổi học bình thường.</p>}
    <label>Giáo án liên quan (ID nếu có)<input value={form.lessonPlanId} onChange={(e) => update("lessonPlanId", e.target.value)} placeholder="Ví dụ: plan-demo-1" /></label>
    <label>Chủ đề thực tế đã dạy<input required value={form.actualTopic} onChange={(e) => update("actualTopic", e.target.value)} /></label>
    <label>Nội dung đã thực hiện<textarea required rows={5} value={form.completedContent} onChange={(e) => update("completedContent", e.target.value)} placeholder="Ghi nội dung, hoạt động và mức độ hoàn thành mục tiêu..." /></label>
    <label>Bài tập về nhà / dặn dò<textarea rows={3} value={form.homework} onChange={(e) => update("homework", e.target.value)} /></label>
    <label>Nội dung dự kiến buổi tiếp theo<textarea rows={3} value={form.nextLesson} onChange={(e) => update("nextLesson", e.target.value)} /></label>
    <label>Ghi chú nội bộ<textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} /></label>
    <label>Thời lượng thực tế (phút)<input type="number" min={10} max={240} required value={form.actualDuration} onChange={(e) => update("actualDuration", e.target.value)} /></label>
    <section className={styles.homeworkBox}>
      <label className={styles.toggle}><input type="checkbox" checked={enabled} disabled={Boolean(existingAssignmentId)} onChange={(e) => setEnabled(e.target.checked)} /> Tạo và giao bài tập cho học sinh sau buổi học</label>
      {existingAssignmentId ? <p className={styles.message}>Buổi học này đã liên kết bài tập {existingAssignmentId}. Hệ thống không tạo thêm bài trùng.</p> : null}
      {enabled && !existingAssignmentId && <>
        <label>Tên bài tập<input required value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label>Hạn nộp<select value={dueDays} onChange={(e) => setDueDays(e.target.value)}><option value="1">Sau 1 ngày</option><option value="2">Sau 2 ngày</option><option value="3">Sau 3 ngày</option><option value="5">Sau 5 ngày</option><option value="7">Sau 7 ngày</option></select></label>
        <h3>Chọn câu hỏi từ Ngân hàng</h3>
        <div className={styles.questionChoices}>{activeQuestions.map((q) => <label key={q.id}><input type="checkbox" checked={selected.includes(q.id)} onChange={(e) => setSelected((old) => e.target.checked ? [...old, q.id] : old.filter((id) => id !== q.id))} /><span>{q.prompt} <small>{q.type} · {q.points} điểm</small></span></label>)}</div>
        <h3>Tạo nhanh câu hỏi trắc nghiệm mới</h3>
        <label>Nội dung câu hỏi<input value={draftPrompt} onChange={(e) => setDraftPrompt(e.target.value)} placeholder="Nhập câu hỏi..." /></label>
        {draftOptions.map((value, index) => <label key={index}>Đáp án {index + 1}<input value={value} onChange={(e) => setDraftOptions((old) => old.map((v, i) => i === index ? e.target.value : v))} /></label>)}
        <label>Đáp án đúng<select value={correct} onChange={(e) => setCorrect(Number(e.target.value))}>{draftOptions.map((_, i) => <option key={i} value={i}>Đáp án {i + 1}</option>)}</select></label>
        <button type="button" className={styles.addQuestion} onClick={addQuestion}>+ Thêm câu hỏi mới</button>
        {newQuestions.map((q) => <p key={q.id} className={styles.message}>✓ {q.prompt}</p>)}
        <p className={styles.helper}>Bài tập sẽ được giao cho toàn bộ học sinh đang hoạt động trong lớp. Học sinh nhận thông báo trong Student Portal.</p>
      </>}
    </section>
    {message && <p role="status" className={styles.message}>{message}</p>}
    <button disabled={pending}>{pending ? "Đang lưu..." : enabled ? "Hoàn thành buổi học & giao bài" : initial ? "Cập nhật biên bản" : "Xác nhận hoàn thành buổi học"}</button>
  </form>;
}
