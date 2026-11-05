import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { getClasses } from "@/mocks/classes";
import { getCurricula } from "@/mocks/curricula";
import { getClassCurriculumAssignments, getClassCurriculum } from "@/mocks/class-curriculum";
import { getClassSessionCompletions } from "@/mocks/teacher-session-completions";
import { assignClassCurriculumAction } from "./actions";
import styles from "./page.module.css";

export const metadata = { title: "Tiến độ giáo trình | Quản trị" };

async function TeachingProgressContent() {
  await connection();
  const [classes, curricula, assignments] = await Promise.all([
    getClasses(), getCurricula(), getClassCurriculumAssignments(),
  ]);
  const rows = await Promise.all(classes.map(async (cls) => {
    const curriculum = await getClassCurriculum(cls.id);
    const completions = await getClassSessionCompletions(cls.id);
    const total = curriculum?.units.reduce((sum, unit) => sum + unit.lessons.length, 0) ?? 0;
    const completedIds = new Set(completions.filter((item) => item.curriculumLessonCompleted && item.curriculumId === curriculum?.id).map((item) => item.curriculumLessonId));
    const completed = completedIds.size;
    return { cls, curriculum, total, completed, percent: total ? Math.round(completed / total * 100) : 0 };
  }));
  const activeCurricula = curricula.filter((item) => item.status === "active");
  return <main className={styles.page}>
    <PageHeader title="Tiến độ giảng dạy" subtitle="Gán giáo trình cho từng lớp và theo dõi Lesson đã được giáo viên xác nhận hoàn thành." />
    <section className={styles.intro}>
      <strong>Nguyên tắc cập nhật</strong>
      <p>Điểm danh và lưu biên bản không tự động hoàn thành Lesson. Giáo viên phải chọn Lesson và xác nhận thủ công trong màn hình hoàn thành buổi học.</p>
    </section>
    <section className={styles.assignments}>
      <h2>Gán giáo trình cho lớp</h2>
      {classes.map((cls) => {
        const eligible = activeCurricula.filter((item) => item.targetType === "grade" ? item.grade === cls.grade : item.courseId === cls.courseId);
        const current = assignments.find((item) => item.classId === cls.id);
        return <form action={assignClassCurriculumAction} className={styles.assignRow} key={cls.id}>
          <input type="hidden" name="classId" value={cls.id} />
          <div><strong>{cls.name}</strong><span>Grade {cls.grade}</span></div>
          <select name="curriculumId" defaultValue={current?.curriculumId ?? ""} required aria-label={`Giáo trình lớp ${cls.name}`}>
            <option value="" disabled>Chọn giáo trình phù hợp</option>
            {eligible.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
          <button type="submit">Lưu gán</button>
        </form>;
      })}
      {activeCurricula.length === 0 ? <p>Chưa có giáo trình đang hoạt động. Hãy tạo giáo trình trước.</p> : null}
    </section>
    <section className={styles.progressSection}>
      <h2>Tiến độ theo lớp</h2>
      <div className={styles.grid}>
        {rows.map(({ cls, curriculum, total, completed, percent }) => <article className={styles.card} key={cls.id}>
          <div className={styles.cardHead}><strong>Lớp {cls.name}</strong><span>Grade {cls.grade}</span></div>
          {curriculum ? <>
            <p className={styles.curriculumName}>{curriculum.title}</p>
            <div className={styles.progressMeta}><strong>{completed}/{total} Lesson</strong><span>{percent}%</span></div>
            <div className={styles.track}><span style={{ width: `${percent}%` }} /></div>
            <p className={styles.note}>Tiến độ dựa trên các Lesson giáo viên đã xác nhận hoàn thành.</p>
          </> : <p className={styles.unassigned}>Chưa được gán giáo trình.</p>}
        </article>)}
      </div>
    </section>
  </main>;
}

export default function TeachingProgressPage() {
  return <Suspense fallback={<p>Đang tải tiến độ giảng dạy...</p>}><TeachingProgressContent /></Suspense>;
}
