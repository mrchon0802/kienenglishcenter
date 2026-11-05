"use client";

import { useMemo, useState, useTransition } from "react";
import type { Student } from "@/types/student";
import type { AssessmentKind, SkillScores } from "@/types/student-assessment";
import { createStudentAssessmentAction } from "./actions";
import styles from "./assessment.module.css";

type ClassData = { id: string; name: string; students: Student[]; curriculumId: string | null; lessons: { id: string; title: string; unitTitle: string }[] };

const SKILLS: { key: keyof SkillScores; label: string }[] = [
  { key: "listening", label: "Listening – Nghe" },
  { key: "speaking", label: "Speaking – Nói" },
  { key: "reading", label: "Reading – Đọc" },
  { key: "writing", label: "Writing – Viết" },
];

export function AssessmentForm({ classes }: { classes: ClassData[] }) {
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [studentId, setStudentId] = useState("");
  const [kind, setKind] = useState<AssessmentKind>("progress");
  const [assessedAt, setAssessedAt] = useState(new Date().toISOString().slice(0, 10));
  const [lessonId, setLessonId] = useState("");
  const [scores, setScores] = useState<SkillScores>({ listening: 0, speaking: 0, reading: 0, writing: 0 });
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [teacherComment, setTeacherComment] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const selectedClass = classes.find((item) => item.id === classId);
  const students = selectedClass?.students ?? [];
  const lessons = selectedClass?.lessons ?? [];
  const average = useMemo(() => (Object.values(scores).reduce((sum, score) => sum + score, 0) / 4).toFixed(1), [scores]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      const result = await createStudentAssessmentAction({
        studentId, classId, kind, assessedAt,
        curriculumId: selectedClass?.curriculumId ?? null,
        curriculumLessonId: lessonId || null,
        curriculumLessonTitle: lessons.find((item) => item.id === lessonId)?.title ?? "",
        scores, strengths, improvements, teacherComment,
      });
      setMessage(result.ok ? "Đã lưu đánh giá học sinh." : result.error);
      if (result.ok) {
        setScores({ listening: 0, speaking: 0, reading: 0, writing: 0 });
        setStrengths(""); setImprovements(""); setTeacherComment(""); setLessonId("");
      }
    });
  }

  if (!classes.length) return <p className={styles.empty}>Bạn chưa được phân công lớp nào để đánh giá học sinh.</p>;

  return <form className={styles.form} onSubmit={submit}>
    <div className={styles.grid}>
      <label>Lớp học
        <select value={classId} onChange={(event) => { setClassId(event.target.value); setStudentId(""); setLessonId(""); }}>
          {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <label>Học sinh
        <select required value={studentId} onChange={(event) => setStudentId(event.target.value)}>
          <option value="">-- Chọn học sinh --</option>
          {students.map((student) => <option key={student.id} value={student.id}>{student.fullName} · {student.code}</option>)}
        </select>
      </label>
      <label>Loại đánh giá
        <select value={kind} onChange={(event) => setKind(event.target.value as AssessmentKind)}>
          <option value="progress">Đánh giá thường xuyên</option>
          <option value="periodic">Đánh giá định kỳ</option>
          <option value="final">Đánh giá cuối khóa</option>
        </select>
      </label>
      <label>Ngày đánh giá
        <input type="date" required value={assessedAt} onChange={(event) => setAssessedAt(event.target.value)} />
      </label>
      <label className={styles.full}>Lesson liên quan (không bắt buộc)
        <select value={lessonId} onChange={(event) => setLessonId(event.target.value)}>
          <option value="">Không gắn với Lesson cụ thể</option>
          {lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.unitTitle} · {lesson.title}</option>)}
        </select>
      </label>
    </div>

    <section className={styles.skills}>
      <div className={styles.sectionHead}><div><h2>Đánh giá 4 kỹ năng</h2><p>Thang điểm từ 0 đến 10.</p></div><strong>Trung bình {average}/10</strong></div>
      <div className={styles.skillGrid}>
        {SKILLS.map((skill) => <label key={skill.key}>{skill.label}
          <input type="number" min="0" max="10" step="0.5" required value={scores[skill.key]} onChange={(event) => setScores((old) => ({ ...old, [skill.key]: Number(event.target.value) }))} />
        </label>)}
      </div>
    </section>
    <label>Điểm mạnh
      <textarea required rows={3} value={strengths} onChange={(event) => setStrengths(event.target.value)} placeholder="Ví dụ: Phát âm rõ, ghi nhớ từ vựng tốt..." />
    </label>
    <label>Nội dung cần cải thiện
      <textarea required rows={3} value={improvements} onChange={(event) => setImprovements(event.target.value)} placeholder="Ví dụ: Cần luyện nghe đoạn hội thoại dài..." />
    </label>
    <label>Nhận xét thêm của giáo viên (không bắt buộc)
      <textarea rows={3} value={teacherComment} onChange={(event) => setTeacherComment(event.target.value)} />
    </label>
    {message ? <p className={styles.message} role="status">{message}</p> : null}
    <button type="submit" disabled={pending || !studentId}>{pending ? "Đang lưu..." : "Lưu đánh giá"}</button>
  </form>;
}
