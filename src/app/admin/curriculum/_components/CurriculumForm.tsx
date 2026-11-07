"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import type { Course } from "@/types/course";
import type { Curriculum, CurriculumInput, CurriculumLesson, CurriculumUnit } from "@/types/curriculum";
import { saveCurriculumAction } from "../actions";
import styles from "./CurriculumForm.module.css";

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const blankLesson = (): CurriculumLesson => ({
  id: makeId("lesson"), title: "", objectives: "", durationMinutes: 60, materials: "", materialUrl: "", homework: "",
});
const blankUnit = (): CurriculumUnit => ({
  id: makeId("unit"), title: "", description: "", lessons: [blankLesson()],
});

function initialValue(curriculum?: Curriculum): CurriculumInput {
  if (curriculum) {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, version: _version, previousVersionId: _previousVersionId, ...input } = curriculum;
    return structuredClone(input);
  }
  return {
    code: "", title: "", description: "", targetType: "grade", grade: 1, courseId: null,
    status: "active", units: [blankUnit()],
  };
}

export function CurriculumForm({ courses, curriculum }: { courses: Course[]; curriculum?: Curriculum }) {
  const router = useRouter();
  const [value, setValue] = useState<CurriculumInput>(() => initialValue(curriculum));
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function updateUnit(unitId: string, patch: Partial<CurriculumUnit>) {
    setValue((current) => ({ ...current, units: current.units.map((unit) => unit.id === unitId ? { ...unit, ...patch } : unit) }));
  }
  function updateLesson(unitId: string, lessonId: string, patch: Partial<CurriculumLesson>) {
    setValue((current) => ({
      ...current,
      units: current.units.map((unit) => unit.id === unitId
        ? { ...unit, lessons: unit.lessons.map((lesson) => lesson.id === lessonId ? { ...lesson, ...patch } : lesson) }
        : unit),
    }));
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await saveCurriculumAction(value, curriculum?.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin/curriculum");
      router.refresh();
    });
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <section className={styles.panel}>
        <h2>Thông tin giáo trình</h2>
        <div className={styles.fields}>
          <label>Mã giáo trình<input required maxLength={24} value={value.code} onChange={(e) => setValue({ ...value, code: e.target.value })} placeholder="VD: GRADE-03" /></label>
          <label>Tên giáo trình<input required value={value.title} onChange={(e) => setValue({ ...value, title: e.target.value })} placeholder="VD: Tiếng Anh lớp 3" /></label>
          <label className={styles.full}>Mô tả<textarea rows={3} value={value.description} onChange={(e) => setValue({ ...value, description: e.target.value })} placeholder="Mô tả nội dung và phạm vi giáo trình..." /></label>
          <label>Áp dụng cho<select value={value.targetType} onChange={(e) => setValue({ ...value, targetType: e.target.value as "grade" | "course", grade: e.target.value === "grade" ? 1 : null, courseId: e.target.value === "course" ? (courses[0]?.id ?? null) : null })}><option value="grade">Khối lớp 1–9</option><option value="course">Khóa học chuyên biệt</option></select></label>
          {value.targetType === "grade" ? (
            <label>Lớp<select value={value.grade ?? 1} onChange={(e) => setValue({ ...value, grade: Number(e.target.value) })}>{Array.from({ length: 9 }, (_, index) => <option key={index + 1} value={index + 1}>Lớp {index + 1}</option>)}</select></label>
          ) : (
            <label>Khóa học<select required value={value.courseId ?? ""} onChange={(e) => setValue({ ...value, courseId: e.target.value })}><option value="">-- Chọn khóa học --</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></label>
          )}
          <label>Trạng thái<select value={value.status} onChange={(e) => setValue({ ...value, status: e.target.value as "active" | "inactive" })}><option value="active">Đang sử dụng</option><option value="inactive">Ngừng sử dụng</option></select></label>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionHead}><div><h2>Nội dung giáo trình</h2><p>Xây dựng cấu trúc Unit và Lesson. Có thể lưu khung lớp trước rồi bổ sung nội dung dần.</p></div><button type="button" className={styles.secondary} onClick={() => setValue({ ...value, units: [...value.units, blankUnit()] })}>+ Thêm Unit</button></div>
        <div className={styles.units}>
          {value.units.length === 0 && <p className={styles.emptyLesson}>Chưa có Unit. Hãy chọn “+ Thêm Unit” để bắt đầu xây dựng chương trình.</p>}
          {value.units.map((unit, unitIndex) => (
            <article className={styles.unit} key={unit.id}>
              <div className={styles.unitHead}><strong>Unit {unitIndex + 1}</strong>{value.units.length > 1 && <button type="button" className={styles.remove} onClick={() => setValue({ ...value, units: value.units.filter((item) => item.id !== unit.id) })}>Xóa Unit</button>}</div>
              <div className={styles.fields}>
                <label>Tên Unit<input required value={unit.title} onChange={(e) => updateUnit(unit.id, { title: e.target.value })} placeholder="VD: Unit 1 – Hello" /></label>
                <label>Mô tả Unit<input value={unit.description} onChange={(e) => updateUnit(unit.id, { description: e.target.value })} placeholder="Chủ đề và nội dung chính" /></label>
              </div>
              <div className={styles.lessonList}>
                {unit.lessons.map((lesson, lessonIndex) => (
                  <div className={styles.lesson} key={lesson.id}>
                    <div className={styles.lessonHead}><b>Lesson {lessonIndex + 1}</b>{unit.lessons.length > 1 && <button type="button" className={styles.remove} onClick={() => updateUnit(unit.id, { lessons: unit.lessons.filter((item) => item.id !== lesson.id) })}>Xóa</button>}</div>
                    <div className={styles.fields}>
                      <label>Tên Lesson<input required value={lesson.title} onChange={(e) => updateLesson(unit.id, lesson.id, { title: e.target.value })} placeholder="VD: Greetings" /></label>
                      <label>Thời lượng (phút)<input type="number" min={1} max={600} required value={lesson.durationMinutes} onChange={(e) => updateLesson(unit.id, lesson.id, { durationMinutes: Number(e.target.value) })} /></label>
                      <label className={styles.full}>Mục tiêu học tập<textarea rows={2} value={lesson.objectives} onChange={(e) => updateLesson(unit.id, lesson.id, { objectives: e.target.value })} placeholder="Sau bài học, học sinh có thể..." /></label>
                      <label>Tài liệu<textarea rows={2} value={lesson.materials} onChange={(e) => updateLesson(unit.id, lesson.id, { materials: e.target.value })} placeholder="Sách, flashcard, audio..." /></label>
                      <label>Link tài liệu<input type="url" value={lesson.materialUrl} onChange={(e) => updateLesson(unit.id, lesson.id, { materialUrl: e.target.value })} placeholder="https://..." /></label>
                      <label className={styles.full}>Bài tập về nhà<textarea rows={2} value={lesson.homework} onChange={(e) => updateLesson(unit.id, lesson.id, { homework: e.target.value })} placeholder="Nội dung bài tập..." /></label>
                    </div>
                  </div>
                ))}
                {unit.lessons.length === 0 && <p className={styles.emptyLesson}>Unit này chưa có Lesson. Bạn có thể bổ sung sau.</p>}
                <button type="button" className={styles.addLesson} onClick={() => updateUnit(unit.id, { lessons: [...unit.lessons, blankLesson()] })}>+ Thêm Lesson</button>
              </div>
            </article>
          ))}
        </div>
      </section>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <div className={styles.footer}><Link href="/admin/curriculum">Quay lại</Link><button type="submit" disabled={pending}>{pending ? "Đang lưu..." : curriculum ? "Tạo phiên bản mới" : "Tạo giáo trình"}</button></div>
    </form>
  );
}
