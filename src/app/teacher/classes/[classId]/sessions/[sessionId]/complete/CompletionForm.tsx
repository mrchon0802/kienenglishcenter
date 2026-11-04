"use client";
import { useState, useTransition } from "react";
import { saveSessionCompletionAction } from "./actions";
import type { TeacherSessionCompletion } from "@/types/teacher-session-completion";
import styles from "./completion.module.css";

export function CompletionForm({ classId, sessionId, topic, initial }: { classId: string; sessionId: string; date: string; topic: string; initial: TeacherSessionCompletion | null }) {
  const [form, setForm] = useState({ lessonPlanId: initial?.lessonPlanId ?? "", actualTopic: initial?.actualTopic ?? topic, completedContent: initial?.completedContent ?? "", homework: initial?.homework ?? "", nextLesson: initial?.nextLesson ?? "", notes: initial?.notes ?? "", actualDuration: String(initial?.actualDuration ?? 40) });
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  function update(key: keyof typeof form, value: string) { setForm((old) => ({ ...old, [key]: value })); }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    startTransition(async () => {
      const result = await saveSessionCompletionAction({ classId, sessionId, ...form, actualDuration: Number(form.actualDuration) });
      setMessage(result.ok ? "Đã lưu biên bản hoàn thành buổi học." : result.error);
    });
  }
  return <form className={styles.form} onSubmit={submit}>
    <label>Giáo án liên quan (ID nếu có)<input value={form.lessonPlanId} onChange={(e) => update("lessonPlanId", e.target.value)} placeholder="Ví dụ: plan-demo-1" /></label>
    <label>Chủ đề thực tế đã dạy<input required value={form.actualTopic} onChange={(e) => update("actualTopic", e.target.value)} /></label>
    <label>Nội dung đã thực hiện<textarea required rows={5} value={form.completedContent} onChange={(e) => update("completedContent", e.target.value)} placeholder="Ghi nội dung, hoạt động và mức độ hoàn thành mục tiêu..." /></label>
    <label>Bài tập về nhà<textarea rows={3} value={form.homework} onChange={(e) => update("homework", e.target.value)} /></label>
    <label>Nội dung dự kiến buổi tiếp theo<textarea rows={3} value={form.nextLesson} onChange={(e) => update("nextLesson", e.target.value)} /></label>
    <label>Ghi chú nội bộ<textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} /></label>
    <label>Thời lượng thực tế (phút)<input type="number" min={10} max={240} required value={form.actualDuration} onChange={(e) => update("actualDuration", e.target.value)} /></label>
    {message && <p role="status" className={styles.message}>{message}</p>}
    <button disabled={pending}>{pending ? "Đang lưu..." : initial ? "Cập nhật biên bản" : "Xác nhận hoàn thành buổi học"}</button>
  </form>;
}
