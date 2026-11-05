import { Suspense } from "react";
import { connection } from "next/server";
import { DEMO_CENTER_USER } from "@/mocks/teacher-session";
import { getTeacherPortalData } from "@/mocks/teacher-portal";
import { getClassCurriculum } from "@/mocks/class-curriculum";
import { getStudentAssessments } from "@/mocks/student-assessments";
import { AssessmentForm } from "./AssessmentForm";
import styles from "./assessment.module.css";

export const metadata = { title: "Đánh giá học sinh | Giáo viên" };

async function AssessmentsContent() {
  await connection();
  const [portal, history] = await Promise.all([
    getTeacherPortalData(DEMO_CENTER_USER.teacherId),
    getStudentAssessments(),
  ]);
  if (!portal) return <p>Không tìm thấy hồ sơ giáo viên.</p>;
  const classes = await Promise.all(portal.classes.map(async (cls) => {
    const curriculum = await getClassCurriculum(cls.id);
    return {
      id: cls.id, name: cls.name, students: cls.students,
      curriculumId: curriculum?.id ?? null,
      lessons: curriculum?.units.flatMap((unit) => unit.lessons.map((lesson) => ({ id: lesson.id, title: lesson.title, unitTitle: unit.title }))) ?? [],
    };
  }));
  const ownHistory = history.filter((item) => item.teacherId === DEMO_CENTER_USER.teacherId);
  return <div className={styles.page}>
    <section className={styles.heading}><div><p className={styles.eyebrow}>STUDENT DEVELOPMENT</p><h1>Đánh giá năng lực học sinh</h1><p className={styles.muted}>Ghi nhận 4 kỹ năng, điểm mạnh và nội dung cần cải thiện qua từng lần đánh giá.</p></div></section>
    <AssessmentForm classes={classes} />
    <section className={styles.form}>
      <div className={styles.sectionHead}><div><h2>Lịch sử đánh giá gần đây</h2><p>Các đánh giá do bạn thực hiện.</p></div><strong>{ownHistory.length} lượt</strong></div>
      {ownHistory.length ? <div className={styles.history}>{ownHistory.slice(0, 12).map((item) => {
        const avg = (Object.values(item.scores).reduce((sum, value) => sum + value, 0) / 4).toFixed(1);
        return <article key={item.id}><div><strong>{item.studentName}</strong><span>{item.studentCode} · Lớp {item.className} · {item.assessedAt}</span></div><b>{avg}/10</b><p>{item.strengths}</p></article>;
      })}</div> : <p className={styles.muted}>Chưa có đánh giá nào.</p>}
    </section>
  </div>;
}

export default function TeacherAssessmentsPage() {
  return <Suspense fallback={<p>Đang tải dữ liệu đánh giá...</p>}><AssessmentsContent /></Suspense>;
}
