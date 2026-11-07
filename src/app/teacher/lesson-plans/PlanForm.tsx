"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { TeacherLessonPlan, TeacherLessonPlanInput } from "@/types/teacher-lesson-plan";
import type { Curriculum } from "@/types/curriculum";
import { saveTeacherLessonPlanAction } from "./actions";
import styles from "./lesson-plans.module.css";

const fields: { key: keyof Pick<TeacherLessonPlanInput, "objectives" | "materials" | "warmUp" | "presentation" | "practice" | "production" | "homework">; label: string; rows: number }[] = [
  { key: "objectives", label: "Mục tiêu bài học *", rows: 3 }, { key: "materials", label: "Học liệu / thiết bị", rows: 2 },
  { key: "warmUp", label: "Khởi động (Warm-up)", rows: 3 }, { key: "presentation", label: "Giới thiệu kiến thức (Presentation)", rows: 3 },
  { key: "practice", label: "Luyện tập (Practice)", rows: 3 }, { key: "production", label: "Vận dụng (Production)", rows: 3 }, { key: "homework", label: "Bài tập về nhà", rows: 2 },
];

export function PlanForm({ classes, curricula, initial }: { classes: { id: string; name: string; grade: number }[]; curricula: Curriculum[]; initial?: TeacherLessonPlan }) {
  const [form, setForm] = useState<TeacherLessonPlanInput>(() => initial ? {
    classId: initial.classId, curriculumId: initial.curriculumId ?? curricula.find((c) => c.grade === initial.grade)?.id ?? "", unitId: initial.unitId ?? "", lessonId: initial.lessonId ?? "", title: initial.title, unit: initial.unit, lesson: initial.lesson, objectives: initial.objectives,
    materials: initial.materials, warmUp: initial.warmUp, presentation: initial.presentation, practice: initial.practice,
    production: initial.production, homework: initial.homework, duration: initial.duration, status: initial.status, visibility: initial.visibility,
  } : {
    classId: "", curriculumId: curricula.find((c) => c.targetType === "grade" && c.grade === 1)?.id ?? curricula[0]?.id ?? "", unitId: "", lessonId: "", title: "", unit: "", lesson: "", objectives: "", materials: "", warmUp: "", presentation: "", practice: "", production: "", homework: "", duration: 40, status: "draft", visibility: "private",
  });
  const selectedCurriculum = curricula.find((item) => item.id === form.curriculumId);
  const selectedUnit = selectedCurriculum?.units.find((item) => item.id === form.unitId);
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
      <label>Chương trình / Lớp *<select value={form.curriculumId} onChange={(e) => { update("curriculumId", e.target.value); update("unitId", ""); update("lessonId", ""); }} required><option value="">Chọn chương trình</option>{curricula.filter((item) => item.status === "active").map((item) => <option key={item.id} value={item.id}>{item.targetType === "grade" ? `Lớp ${item.grade}` : item.title} · {item.title}</option>)}</select></label>
      <label>Unit *<select value={form.unitId ?? ""} onChange={(e) => { update("unitId", e.target.value); update("lessonId", ""); }} required><option value="">Chọn Unit</option>{selectedCurriculum?.units.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <label>Lesson *<select value={form.lessonId ?? ""} onChange={(e) => update("lessonId", e.target.value)} required><option value="">Chọn Lesson</option>{selectedUnit?.lessons.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <label>Tiêu đề giáo án *<input value={form.title} onChange={(e) => update("title", e.target.value)} required maxLength={120} placeholder="Ví dụ: Giáo án luyện nói" /></label>
      <label>Thời lượng (phút)<input type="number" min={10} max={180} value={form.duration} onChange={(e) => update("duration", Number(e.target.value))} required /></label>
      <label>Trạng thái<select value={form.status} onChange={(e) => update("status", e.target.value as TeacherLessonPlanInput["status"])}><option value="draft">Bản nháp</option><option value="ready">Sẵn sàng</option></select></label>

    </div>
    {fields.map((field) => <label className={styles.fullField} key={field.key}>{field.label}<textarea rows={field.rows} value={form[field.key]} onChange={(e) => update(field.key, e.target.value)} /></label>)}
    {message ? <p role="alert" className={styles.error}>{message}</p> : null}
    <div className={styles.formActions}><Link href="/teacher/lesson-plans">Hủy</Link><button type="submit" disabled={isPending || !curricula.some((item) => item.status === "active")}>{isPending ? "Đang lưu..." : "Lưu giáo án"}</button></div>
  </form>;
}
