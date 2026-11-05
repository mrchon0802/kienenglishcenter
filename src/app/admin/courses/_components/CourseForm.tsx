"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import type { Course, CourseInput, CourseLevel, CourseUnit } from "@/types/course";
import { saveCourseAction } from "../actions";
import styles from "./CourseForm.module.css";

const LEVELS: CourseLevel[] = ["Beginner", "Elementary", "Pre-Intermediate", "Intermediate", "Upper-Intermediate", "Advanced"];

export function CourseForm({ course }: { course?: Course }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState(course?.code ?? "");
  const [name, setName] = useState(course?.name ?? "");
  const [level, setLevel] = useState<CourseLevel>(course?.level ?? "Beginner");
  const [description, setDescription] = useState(course?.description ?? "");
  const [objectives, setObjectives] = useState(course?.objectives.join("\n") ?? "");
  const [durationWeeks, setDurationWeeks] = useState(String(course?.durationWeeks ?? 12));
  const [totalSessions, setTotalSessions] = useState(String(course?.totalSessions ?? 24));
  const [standardFee, setStandardFee] = useState(String(course?.standardFee ?? 3600000));
  const [status, setStatus] = useState<Course["status"]>(course?.status ?? "active");
  const [units, setUnits] = useState<CourseUnit[]>(course?.units ?? [{ id: "unit-1", title: "Unit 1", lessons: 6 }]);
  const [error, setError] = useState("");

  function updateUnit(index: number, patch: Partial<CourseUnit>) {
    setUnits((current) => current.map((unit, i) => i === index ? { ...unit, ...patch } : unit));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const input: CourseInput = {
      code, name, level, description,
      objectives: objectives.split("\n").map((item) => item.trim()).filter(Boolean),
      durationWeeks: Number(durationWeeks),
      totalSessions: Number(totalSessions),
      standardFee: Number(standardFee),
      status,
      units,
    };
    startTransition(async () => {
      const result = await saveCourseAction(input, course?.id);
      if (result.ok) router.push(`/admin/courses/${result.id}`);
      else setError(result.error);
    });
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <section className={styles.panel}>
        <h2>Thông tin khóa học</h2>
        <div className={styles.grid}>
          <label>Mã khóa học<input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ENG-BEG" required maxLength={16} /></label>
          <label>Tên khóa học<input value={name} onChange={(e) => setName(e.target.value)} placeholder="English for Beginners" required /></label>
          <label>Cấp độ<select value={level} onChange={(e) => setLevel(e.target.value as CourseLevel)}>{LEVELS.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Trạng thái<select value={status} onChange={(e) => setStatus(e.target.value as Course["status"])}><option value="active">Đang hoạt động</option><option value="inactive">Ngừng hoạt động</option></select></label>
          <label>Số tuần<input type="number" min="1" max="104" value={durationWeeks} onChange={(e) => setDurationWeeks(e.target.value)} required /></label>
          <label>Tổng số buổi<input type="number" min="1" max="500" value={totalSessions} onChange={(e) => setTotalSessions(e.target.value)} required /></label>
          <label>Học phí tiêu chuẩn (VNĐ)<input type="number" min="0" step="10000" value={standardFee} onChange={(e) => setStandardFee(e.target.value)} required /></label>
        </div>
        <label className={styles.full}>Mô tả khóa học<textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Giới thiệu nội dung và đối tượng phù hợp..." /></label>
        <label className={styles.full}>Mục tiêu học tập <small>Mỗi mục tiêu nhập trên một dòng.</small><textarea rows={3} value={objectives} onChange={(e) => setObjectives(e.target.value)} placeholder={"Giao tiếp trong tình huống quen thuộc\nNắm vững từ vựng nền tảng"} /></label>
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionHead}>
          <div><h2>Chương trình học</h2><p>Thêm các Unit dự kiến trong khóa học. Có thể chỉnh sửa sau.</p></div>
          <button type="button" className={styles.secondary} onClick={() => setUnits((current) => [...current, { id: `unit-${Date.now()}`, title: `Unit ${current.length + 1}`, lessons: 6 }])}>+ Thêm Unit</button>
        </div>
        <div className={styles.units}>
          {units.map((unit, index) => (
            <div className={styles.unitRow} key={unit.id}>
              <label>Unit {index + 1}<input value={unit.title} onChange={(e) => updateUnit(index, { title: e.target.value })} required /></label>
              <label>Số bài học<input type="number" min="1" max="100" value={unit.lessons} onChange={(e) => updateUnit(index, { lessons: Number(e.target.value) })} required /></label>
              <button type="button" className={styles.remove} onClick={() => setUnits((current) => current.filter((item) => item.id !== unit.id))} disabled={units.length === 1}>Xóa</button>
            </div>
          ))}
        </div>
      </section>
      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={() => router.back()}>Hủy</button>
        <button type="submit" className={styles.primary} disabled={pending}>{pending ? "Đang lưu..." : course ? "Lưu thay đổi" : "Tạo khóa học"}</button>
      </div>
    </form>
  );
}
