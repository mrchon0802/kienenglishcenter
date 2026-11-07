"use client";

import { useMemo, useState } from "react";
import type { TeacherLessonPlan } from "@/types/teacher-lesson-plan";
import type { Teacher } from "@/types/teacher";
import type { Curriculum } from "@/types/curriculum";
import { shareLessonPlanAction } from "./actions";
import styles from "@/app/teacher/lesson-plans/lesson-plans.module.css";

interface Props {
  plans: TeacherLessonPlan[];
  teachers: Teacher[];
  curricula: Curriculum[];
}

export function AdminLessonPlanManager({ plans, teachers, curricula }: Props) {
  const [query, setQuery] = useState("");
  const [curriculumId, setCurriculumId] = useState("all");
  const [teacherId, setTeacherId] = useState("all");
  const [status, setStatus] = useState("all");
  const [unitId, setUnitId] = useState("all");
  const [lessonId, setLessonId] = useState("all");

  const selectedCurriculum = curricula.find((item) => item.id === curriculumId);
  const selectedUnit = selectedCurriculum?.units.find((item) => item.id === unitId);
  const teacherMap = useMemo(() => new Map(teachers.map((item) => [item.id, item.fullName])), [teachers]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("vi-VN");
    return plans.filter((plan) => {
      const matchesQuery = !normalized || [plan.title, plan.unit, plan.lesson, plan.objectives, teacherMap.get(plan.teacherId) ?? plan.teacherId]
        .some((value) => value.toLocaleLowerCase("vi-VN").includes(normalized));
      return matchesQuery
        && (curriculumId === "all" || plan.curriculumId === curriculumId)
        && (teacherId === "all" || plan.teacherId === teacherId)
        && (status === "all" || plan.status === status)
        && (unitId === "all" || plan.unitId === unitId)
        && (lessonId === "all" || plan.lessonId === lessonId);
    });
  }, [plans, query, curriculumId, teacherId, status, unitId, lessonId, teacherMap]);

  return (
    <>
      <section className={styles.filterPanel} aria-label="Bộ lọc giáo án">
        <label className={styles.filterField}>Tìm kiếm
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên giáo án, người soạn, nội dung..." />
        </label>
        <label className={styles.filterField}>Chương trình
          <select value={curriculumId} onChange={(event) => { setCurriculumId(event.target.value); setUnitId("all"); setLessonId("all"); }}>
            <option value="all">Tất cả chương trình</option>
            {curricula.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </label>
        <label className={styles.filterField}>Unit
          <select value={unitId} disabled={curriculumId === "all"} onChange={(event) => { setUnitId(event.target.value); setLessonId("all"); }}>
            <option value="all">Tất cả Unit</option>
            {(selectedCurriculum?.units ?? []).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </label>
        <label className={styles.filterField}>Lesson
          <select value={lessonId} disabled={unitId === "all"} onChange={(event) => setLessonId(event.target.value)}>
            <option value="all">Tất cả Lesson</option>
            {(selectedUnit?.lessons ?? []).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </label>
        <label className={styles.filterField}>Người soạn
          <select value={teacherId} onChange={(event) => setTeacherId(event.target.value)}>
            <option value="all">Tất cả giáo viên</option>
            {teachers.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
          </select>
        </label>
        <label className={styles.filterField}>Trạng thái
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="ready">Sẵn sàng</option>
            <option value="draft">Bản nháp</option>
          </select>
        </label>
        <button type="button" className={styles.resetFilters} onClick={() => { setQuery(""); setCurriculumId("all"); setTeacherId("all"); setStatus("all"); setUnitId("all"); setLessonId("all"); }}>Xóa bộ lọc</button>
      </section>

      <p className={styles.resultCount}>Hiển thị <strong>{filtered.length}</strong> / {plans.length} giáo án</p>
      {filtered.length ? <div className={styles.cards}>{filtered.map((plan) => (
        <article className={styles.card} key={plan.id}>
          <div className={styles.cardMeta}>
            <span className={styles.pill}>{plan.grade ? `Lớp ${plan.grade}` : "Khóa chuyên biệt"}</span>
            <span className={styles.pill}>{plan.status === "ready" ? "Sẵn sàng" : "Bản nháp"}</span>
            <span className={styles.pill}>{(plan.sharedWithTeacherIds ?? []).length} giáo viên được chia sẻ</span>
          </div>
          <h2>{plan.title}</h2>
          <p>{curricula.find((item) => item.id === plan.curriculumId)?.title ?? "Chưa gắn chương trình"}</p>
          <p>{plan.unit} · {plan.lesson}</p>
          <p>Người soạn: <strong>{teacherMap.get(plan.teacherId) ?? plan.teacherId}</strong></p>
          <p>Cập nhật: {new Date(plan.updatedAt).toLocaleString("vi-VN")}</p>
          <details className={styles.planPreview}>
            <summary>Xem nội dung giáo án</summary>
            <div><strong>Mục tiêu</strong><p>{plan.objectives || "Chưa nhập"}</p></div>
            <div><strong>Tài liệu</strong><p>{plan.materials || "Chưa nhập"}</p></div>
            <div><strong>Warm-up</strong><p>{plan.warmUp || "Chưa nhập"}</p></div>
            <div><strong>Presentation</strong><p>{plan.presentation || "Chưa nhập"}</p></div>
            <div><strong>Practice</strong><p>{plan.practice || "Chưa nhập"}</p></div>
            <div><strong>Production</strong><p>{plan.production || "Chưa nhập"}</p></div>
            <div><strong>Homework</strong><p>{plan.homework || "Chưa nhập"}</p></div>
          </details>
          <form action={shareLessonPlanAction} className={styles.shareForm}>
            <input type="hidden" name="planId" value={plan.id} />
            <label>Chia sẻ cho giáo viên (có thể chọn nhiều)
              <select name="teacherIds" multiple defaultValue={plan.sharedWithTeacherIds ?? []}>
                {teachers.filter((teacher) => teacher.id !== plan.teacherId).map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.fullName} · {teacher.teacherCode}</option>)}
              </select>
            </label>
            <button type="submit">Lưu danh sách chia sẻ</button>
            <small>Chỉ giáo viên được chọn mới thấy giáo án. Bỏ chọn tất cả và lưu để thu hồi toàn bộ quyền chia sẻ. Bản gốc không thể bị giáo viên chỉnh sửa.</small>
          </form>
        </article>
      ))}</div> : <div className={styles.empty}>Không tìm thấy giáo án phù hợp với bộ lọc.</div>}
    </>
  );
}
