"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { TeacherLessonPlan, TeacherLessonPlanInput } from "@/types/teacher-lesson-plan";
import { saveTeacherLessonPlanAction } from "./actions";
import styles from "./lesson-plans.module.css";

const fields: { key: keyof Pick<TeacherLessonPlanInput, "objectives" | "materials" | "warmUp" | "presentation" | "practice" | "production" | "homework">; label: string; rows: number }[] = [
  { key: "objectives", label: "Mục tiêu bài học *", rows: 3 }, { key: "materials", label: "Học liệu / thiết bị", rows: 2 },
  { key: "warmUp", label: "Khởi động (Warm-up)", rows: 3 }, { key: "presentation", label: "Giới thiệu kiến thức (Presentation)", rows: 3 },
  { key: "practice", label: "Luyện tập (Practice)", rows: 3 }, { key: "production", label: "Vận dụng (Production)", rows: 3 }, { key: "homework", label: "Bài tập về nhà", rows: 2 },
];

export function PlanForm({ classes, initial }: { classes: { id: string; name: string; grade: number }[]; initial?: TeacherLessonPlan }) {
  const [form, setForm] = useState<TeacherLessonPlanInput>(() => initial ? {
    classId: initial.classId, title: initial.title, unit: initial.unit, lesson: initial.lesson, objectives: initial.objectives,
    materials: initial.materials, warmUp: initial.warmUp, presentation: initial.presentation, practice: initial.practice,
    production: initial.production, homework: initial.homework, duration: initial.duration, status: initial.status, visibility: initial.visibility,
  } : {
    classId: classes[0]?.id ?? "", title: "", unit: "", lesson: "", objectives: "", materials: "", warmUp: "", presentation: "", practice: "", production: "", homework: "", duration: 40, status: "draft", visibility: "private",
  });
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  function update<K extends keyof TeacherLessonPlanInput>(key: K, value: TeacherLessonPlanInput[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    startTransition(async () => {
      const result = await saveTeacherLessonPlanAction(form, initial?.id);
      if (result.ok) window.location.href = `/teacher/lesson-plans/${result.id}`;
      else setMessage(result.error);
    });
  }
  return <form className={styles.form} onSubmit={submit}>
    <div className={styles.formGrid}>
      <label>Lớp phụ trách *<select value={form.classId} onChange={(e) => update("classId", e.target.value)} required>{classes.map((item) => <option key={item.id} value={item.id}>{item.name} · Khối {item.grade}</option>)}</select></label>
      <label>Tiêu đề giáo án *<input value={form.title} onChange={(e) => update("title", e.target.value)} required maxLength={120} placeholder="Ví dụ: Unit 2 – Vocabulary" /></label>
      <label>Unit *<input value={form.unit} onChange={(e) => update("unit", e.target.value)} required placeholder="Unit 2" /></label>
      <label>Lesson *<input value={form.lesson} onChange={(e) => update("lesson", e.target.value)} required placeholder="Lesson 1 – Vocabulary" /></label>
      <label>Thời lượng (phút)<input type="number" min={10} max={180} value={form.duration} onChange={(e) => update("duration", Number(e.target.value))} required /></label>
      <label>Trạng thái<select value={form.status} onChange={(e) => update("status", e.target.value as TeacherLessonPlanInput["status"])}><option value="draft">Bản nháp</option><option value="ready">Sẵn sàng</option></select></label>
      <label>Chia sẻ<select value={form.visibility} onChange={(e) => update("visibility", e.target.value as TeacherLessonPlanInput["visibility"])}><option value="private">Chỉ mình tôi</option><option value="shared">Chia sẻ với giáo viên phụ trách cùng lớp</option></select></label>
    </div>
    {fields.map((field) => <label className={styles.fullField} key={field.key}>{field.label}<textarea rows={field.rows} value={form[field.key]} onChange={(e) => update(field.key, e.target.value)} /></label>)}
    {message ? <p role="alert" className={styles.error}>{message}</p> : null}
    <div className={styles.formActions}><Link href="/teacher/lesson-plans">Hủy</Link><button type="submit" disabled={isPending || !classes.length}>{isPending ? "Đang lưu..." : "Lưu giáo án"}</button></div>
  </form>;
}
