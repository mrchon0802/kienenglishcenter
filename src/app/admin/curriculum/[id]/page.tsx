import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { getCurricula, getCurriculumById, getCurriculumTargetLabel } from "@/mocks/curricula";
import { getAllTeacherLessonPlans } from "@/mocks/teacher-lesson-plans";
import { getQuestions } from "@/mocks/questions";
import { getAssignments, getAttempts } from "@/mocks/assignments";
import styles from "./page.module.css";

export const metadata = { title: "Tổng quan học liệu | Quản trị" };

type LessonRow = {
  id: string;
  title: string;
  unitId: string;
  unitTitle: string;
  planCount: number;
  questionCount: number;
  practiceCount: number;
  testCount: number;
  usedQuestionCount: number;
  submissionCount: number;
};

async function CurriculumOverview({ id }: { id: string }) {
  await connection();
  const curriculum = await getCurriculumById(id);
  if (!curriculum) {
    return <div className={styles.empty}><h2>Không tìm thấy chương trình</h2><Link href="/admin/curriculum">Quay lại danh sách giáo trình</Link></div>;
  }

  const [targetLabel, plans, questions, assignments, allCurricula] = await Promise.all([
    getCurriculumTargetLabel(curriculum),
    getAllTeacherLessonPlans(),
    getQuestions(),
    getAssignments(),
    getCurricula(),
  ]);
  const versions = allCurricula.filter((item) => item.code === curriculum.code).sort((a, b) => (a.version ?? 1) - (b.version ?? 1));

  const rows: LessonRow[] = [];
  for (const unit of curriculum.units) {
    for (const lesson of unit.lessons) {
      const lessonPlans = plans.filter((item) => item.curriculumId === curriculum.id && item.unitId === unit.id && item.lessonId === lesson.id);
      const lessonQuestions = questions.filter((item) => item.curriculumId === curriculum.id && item.unitId === unit.id && item.lessonId === lesson.id && item.status !== "archived");
      const lessonAssignments = assignments.filter((item) => item.curriculumId === curriculum.id && item.unitId === unit.id && item.lessonId === lesson.id);
      let submissionCount = 0;
      for (const assignment of lessonAssignments) submissionCount += (await getAttempts(assignment.id)).length;
      rows.push({
        id: lesson.id,
        title: lesson.title,
        unitId: unit.id,
        unitTitle: unit.title,
        planCount: lessonPlans.length,
        questionCount: lessonQuestions.length,
        practiceCount: lessonAssignments.filter((item) => item.kind === "practice").length,
        testCount: lessonAssignments.filter((item) => item.kind === "test").length,
        usedQuestionCount: lessonAssignments.reduce((sum, item) => sum + item.questions.length, 0),
        submissionCount,
      });
    }
  }

  const totalPlans = rows.reduce((sum, row) => sum + row.planCount, 0);
  const totalQuestions = rows.reduce((sum, row) => sum + row.questionCount, 0);
  const totalPractices = rows.reduce((sum, row) => sum + row.practiceCount, 0);
  const totalTests = rows.reduce((sum, row) => sum + row.testCount, 0);
  const linkedLessons = rows.filter((row) => row.planCount + row.questionCount + row.practiceCount + row.testCount > 0).length;
  const missingLessons = rows.filter((row) => row.planCount === 0 || row.questionCount === 0 || row.practiceCount + row.testCount === 0);

  return <>
    <PageHeader
      title={curriculum.title}
      subtitle={`${targetLabel} · ${curriculum.code} · Phiên bản ${curriculum.version ?? 1} · Tổng quan giáo án, câu hỏi, bài tập và bài kiểm tra theo từng Lesson.`}
      actions={<><Button href="/admin/curriculum">Quay lại</Button><Button href={`/admin/curriculum/${curriculum.id}/edit`} variant="primary">Chỉnh sửa chương trình</Button></>}
    />
    {versions.length > 1 && <section className={styles.versionHistory}>
      <h2>Lịch sử phiên bản</h2>
      <div className={styles.versionList}>
        {versions.map((version) => <Link key={version.id} href={`/admin/curriculum/${version.id}`} className={`${styles.versionItem} ${version.id === curriculum.id ? styles.versionCurrent : ""}`}>
          <strong>Phiên bản {version.version ?? 1}</strong>
          <span>{version.status === "active" ? "Đang sử dụng" : "Lưu trữ"}</span>
          <small>Cập nhật: {version.updatedAt}</small>
        </Link>)}
      </div>
    </section>}
    <div className={styles.stats}>
      <article className={styles.stat}><strong>{curriculum.units.length}</strong><span>Units</span></article>
      <article className={styles.stat}><strong>{rows.length}</strong><span>Lessons</span></article>
      <article className={styles.stat}><strong>{totalPlans}</strong><span>Giáo án</span></article>
      <article className={styles.stat}><strong>{totalQuestions}</strong><span>Câu hỏi đang hoạt động</span></article>
      <article className={styles.stat}><strong>{totalPractices}</strong><span>Bài tập</span></article>
      <article className={styles.stat}><strong>{totalTests}</strong><span>Bài kiểm tra</span></article>
      <article className={styles.stat}><strong>{linkedLessons}</strong><span>Lesson có học liệu</span></article>
      <article className={styles.stat}><strong>{missingLessons.length}</strong><span>Lesson còn thiếu học liệu</span></article>
    </div>

    <section className={styles.panel}>
      <div className={styles.sectionHead}>
        <div><h2>Chi tiết học liệu theo Unit / Lesson</h2><p>Chỉ tính những học liệu đã liên kết bằng đúng Curriculum ID, Unit ID và Lesson ID.</p></div>
        <span className={curriculum.status === "active" ? styles.active : styles.inactive}>{curriculum.status === "active" ? "Đang sử dụng" : "Ngừng sử dụng"}</span>
      </div>
      {curriculum.units.length === 0 ? <div className={styles.empty}>Chương trình chưa có Unit. Hãy bổ sung cấu trúc chương trình trước.</div> :
        curriculum.units.map((unit) => {
          const unitRows = rows.filter((row) => row.unitId === unit.id);
          return <section className={styles.unit} key={unit.id}>
            <div className={styles.unitHead}><div><h3>{unit.title}</h3><p>{unit.description || "Chưa có mô tả Unit."}</p></div><span>{unit.lessons.length} Lesson</span></div>
            {unit.lessons.length === 0 ? <p className={styles.emptyInline}>Unit này chưa có Lesson.</p> :
              <div className={styles.lessonList}>
                {unit.lessons.map((lesson) => {
                  const row = unitRows.find((item) => item.id === lesson.id);
                  if (!row) return null;
                  const missing = row.planCount === 0 || row.questionCount === 0 || row.practiceCount + row.testCount === 0;
                  return <article className={styles.lesson} key={lesson.id}>
                    <div className={styles.lessonTitle}><div><h4>{lesson.title}</h4><p>{lesson.objectives || "Chưa cập nhật mục tiêu học tập."}</p></div><span className={missing ? styles.needsWork : styles.complete}>{missing ? "Cần bổ sung" : "Đã có đủ nhóm học liệu"}</span></div>
                    <div className={styles.metrics}>
                      <span><b>{row.planCount}</b> Giáo án</span>
                      <span><b>{row.questionCount}</b> Câu hỏi</span>
                      <span><b>{row.practiceCount}</b> Bài tập</span>
                      <span><b>{row.testCount}</b> Bài kiểm tra</span>
                      <span><b>{row.usedQuestionCount}</b> Lượt câu hỏi trong bài</span>
                      <span><b>{row.submissionCount}</b> Lượt nộp bài</span>
                    </div>
                    <div className={styles.lessonActions}>
                      <Link href="/admin/lesson-plans">Quản lý giáo án</Link>
                      <Link href="/admin/question-bank">Ngân hàng câu hỏi</Link>
                      <Link href="/admin/assignments">Bài tập & bài kiểm tra</Link>
                    </div>
                  </article>;
                })}
              </div>}
          </section>;
        })}
    </section>

    <section className={styles.note}>
      <h2>Về số liệu thống kê</h2>
      <p>Giáo án, câu hỏi và bài tập chưa có đủ liên kết chương trình / Unit / Lesson sẽ không được cộng vào thống kê của Lesson này. Các học liệu cũ chưa phân loại vẫn được giữ nguyên trong kho tương ứng để Admin kiểm tra và phân loại sau.</p>
      <p>Số lượt nộp bài được tính từ các lần làm bài đã lưu trong hệ thống. Số câu hỏi trong bài là tổng số câu hỏi snapshot ở các bài tập và bài kiểm tra thuộc Lesson.</p>
    </section>
  </>;
}

export default function CurriculumOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<p>Đang tải thống kê học liệu...</p>}><OverviewLoader params={params} /></Suspense>;
}

async function OverviewLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CurriculumOverview id={id} />;
}
