import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentStudentId } from "@/lib/current-user";
import { getStudentById } from "@/mocks/students";
import { getClasses } from "@/mocks/classes";
import { getClassCurriculum } from "@/mocks/class-curriculum";
import { getClassSessionCompletions } from "@/mocks/teacher-session-completions";
import { getCourseEnrollments } from "@/mocks/course-enrollments";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Tiến độ học tập | Kien English Center",
};

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
}

async function ParentLearningProgressContent() {
  await connection();
  const currentStudentId = await getCurrentStudentId();

  const student = await getStudentById(currentStudentId);

  if (!student) {
    return (
      <section className={styles.notice}>
        <h1>Không tìm thấy hồ sơ học sinh</h1>
        <p>Vui lòng liên hệ trung tâm để kiểm tra tài khoản.</p>
      </section>
    );
  }

  const [classes, enrollments] = await Promise.all([getClasses(), getCourseEnrollments()]);
  const normalizeClassName = (value: string) => value.trim().toLocaleLowerCase("vi-VN");
  const studentClass = classes.find((item) => normalizeClassName(item.name) === normalizeClassName(student.className));

  const primaryProgress = studentClass
    ? await buildClassProgress(studentClass.id)
    : null;

  const activeEnrollments = enrollments.filter(
    (item) => item.studentId === student.id && item.status === "active",
  );
  const courseProgressItems = await Promise.all(
    activeEnrollments.map(async (enrollment) => {
      const cls = classes.find((item) => item.id === enrollment.classId);
      if (!cls) return null;
      const progress = await buildClassProgress(cls.id);
      return { enrollment, cls, progress };
    }),
  );
  const courseProgress = courseProgressItems.filter(
    (item): item is NonNullable<typeof item> => item !== null,
  );

  async function buildClassProgress(classId: string) {
    const [curriculum, completions] = await Promise.all([
      getClassCurriculum(classId),
      getClassSessionCompletions(classId),
    ]);
    const relevant = completions.filter(
      (item) => item.curriculumLessonCompleted && item.curriculumId === curriculum?.id && item.curriculumLessonId,
    );
    const byLesson = new Map<string, (typeof relevant)[number]>();
    for (const item of relevant) {
      if (item.curriculumLessonId && !byLesson.has(item.curriculumLessonId)) byLesson.set(item.curriculumLessonId, item);
    }
    const lessons = curriculum?.units.flatMap((unit) => unit.lessons.map((lesson) => ({
      ...lesson,
      unitId: unit.id,
      unitTitle: unit.title,
      completion: byLesson.get(lesson.id) ?? null,
    }))) ?? [];
    const completed = lessons.filter((lesson) => lesson.completion).length;
    return {
      curriculum,
      lessons,
      completions: relevant.slice().sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
      completed,
      total: lessons.length,
      percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0,
    };
  }

  const curriculum = primaryProgress?.curriculum ?? null;
  const allLessons = primaryProgress?.lessons ?? [];
  const completedCount = primaryProgress?.completed ?? 0;
  const totalCount = primaryProgress?.total ?? 0;
  const percent = primaryProgress?.percent ?? 0;
  const nextLesson = allLessons.find((lesson) => !lesson.completion);
  const relevantCompletions = primaryProgress?.completions ?? [];
  const history = relevantCompletions.slice(0, 8);

  return (
    <div className={styles.page}>
      <section className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>PARENT PORTAL</span>
          <h1>Tiến độ học tập</h1>
          <p>Theo dõi giáo trình và những nội dung giáo viên đã xác nhận hoàn thành.</p>
        </div>
        <div className={styles.student}>
          <strong>{student.fullName}</strong>
          <span>Lớp chính {studentClass?.name ?? student.className}{studentClass ? ` · Grade ${studentClass.grade}` : ""}</span>
        </div>
      </section>

      {!studentClass ? (
        <section className={styles.notice}>
          <h2>Chưa tìm thấy lớp chính</h2>
          <p>Không tìm thấy lớp {student.className} trong danh sách lớp hiện tại. Vui lòng liên hệ trung tâm để kiểm tra hồ sơ.</p>
        </section>
      ) : !curriculum ? (
        <section className={styles.notice}>
          <h2>Lớp chính chưa được gán giáo trình</h2>
          <p>Trung tâm chưa gán giáo trình cho lớp {studentClass.name}. Tiến độ sẽ hiển thị tại đây sau khi giáo trình được thiết lập.</p>
        </section>
      ) : (
        <>
          <section className={styles.overview}>
            <div className={styles.overviewTop}>
              <div>
                <span className={styles.label}>GIÁO TRÌNH ĐANG HỌC</span>
                <h2>{curriculum.title}</h2>
                <p>{curriculum.description || "Giáo trình được trung tâm sử dụng cho lớp học này."}</p>
              </div>
              <div className={styles.percent}>{percent}%</div>
            </div>
            <div
              className={styles.track}
              role="progressbar"
              aria-label="Tiến độ hoàn thành giáo trình"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
            >
              <span style={{ width: `${percent}%` }} />
            </div>
            <div className={styles.progressMeta}>
              <strong>{completedCount}/{totalCount} Lesson đã hoàn thành</strong>
              <span>{curriculum.units.length} Unit</span>
            </div>
            {nextLesson ? (
              <div className={styles.nextLesson}>
                <span className={styles.label}>NỘI DUNG TIẾP THEO CHƯA HOÀN THÀNH</span>
                <strong>{nextLesson.unitTitle} · {nextLesson.title}</strong>
                <span>{nextLesson.objectives || "Chưa có mục tiêu học tập được cập nhật."}</span>
              </div>
            ) : totalCount > 0 ? (
              <div className={styles.completeMessage}>Học sinh đã hoàn thành tất cả Lesson trong giáo trình hiện tại.</div>
            ) : (
              <div className={styles.nextLesson}>Giáo trình chưa có Lesson.</div>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div>
                <h2>Nội dung giáo trình</h2>
                <p>Trạng thái được cập nhật khi giáo viên chọn Lesson và xác nhận hoàn thành buổi học.</p>
              </div>
              <span className={styles.counter}>{completedCount}/{totalCount} Lesson</span>
            </div>

            <div className={styles.units}>
              {curriculum.units.map((unit, unitIndex) => {
                const unitLessons = allLessons.filter((lesson) => lesson.unitId === unit.id);
                const unitCompleted = unitLessons.filter((lesson) => lesson.completion).length;
                return (
                  <article className={styles.unit} key={unit.id}>
                    <div className={styles.unitHead}>
                      <div>
                        <span className={styles.unitNumber}>UNIT {unitIndex + 1}</span>
                        <h3>{unit.title}</h3>
                        {unit.description ? <p>{unit.description}</p> : null}
                      </div>
                      <span className={styles.unitCount}>{unitCompleted}/{unitLessons.length}</span>
                    </div>
                    <ul className={styles.lessonList}>
                      {unitLessons.map((lesson) => (
                        <li key={lesson.id}>
                          <span className={lesson.completion ? styles.checkDone : styles.checkPending} aria-hidden="true">
                            {lesson.completion ? "✓" : "○"}
                          </span>
                          <span className={styles.lessonInfo}>
                            <strong>{lesson.title}</strong>
                            <small>{lesson.objectives || "Chưa có mô tả mục tiêu."}</small>
                            {lesson.completion ? (
                              <small className={styles.completedAt}>
                                Giáo viên xác nhận: {dateLabel(lesson.completion.completedAt)}
                              </small>
                            ) : null}
                          </span>
                          <span className={lesson.completion ? styles.done : styles.pending}>
                            {lesson.completion ? "Đã hoàn thành" : "Chưa hoàn thành"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <h2>Tiến độ khóa học chuyên biệt</h2>
            <p>Các khóa học bổ sung mà học sinh đang đăng ký ngoài lớp chính.</p>
          </div>
          <span className={styles.counter}>{courseProgress.length} khóa học</span>
        </div>
        {courseProgress.length ? (
          <div className={styles.courseList}>
            {courseProgress.map(({ enrollment, cls, progress: course }) => (
              <article className={styles.courseCard} key={enrollment.id}>
                <div className={styles.courseHead}>
                  <div><strong>{enrollment.courseName}</strong><small>Lớp {cls.name} · Đăng ký {dateLabel(enrollment.enrolledAt)}</small></div>
                  <strong className={styles.coursePercent}>{course.percent}%</strong>
                </div>
                {course.curriculum ? <>
                  <p className={styles.courseCurriculum}>{course.curriculum.title}</p>
                  <div className={styles.track} role="progressbar" aria-label={`Tiến độ ${course.curriculum.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={course.percent}><span style={{ width: `${course.percent}%` }} /></div>
                  <div className={styles.progressMeta}><strong>{course.completed}/{course.total} Lesson đã hoàn thành</strong><span>{course.curriculum.units.length} Unit</span></div>
                  {course.total ? <ul className={styles.courseLessonList}>{course.lessons.map((lesson) => <li key={lesson.id}><span>{lesson.title}</span><span className={lesson.completion ? styles.done : styles.pending}>{lesson.completion ? "Đã hoàn thành" : "Chưa hoàn thành"}</span></li>)}</ul> : <p className={styles.empty}>Giáo trình chưa có Lesson.</p>}
                </> : <p className={styles.empty}>Lớp học này chưa được gán giáo trình.</p>}
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>Học sinh hiện chưa đăng ký khóa học chuyên biệt nào.</p>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <h2>Lịch sử nội dung đã học</h2>
            <p>Các buổi học có Lesson được giáo viên xác nhận hoàn thành gần đây.</p>
          </div>
          <span className={styles.counter}>{history.length} buổi</span>
        </div>
        {history.length ? (
          <ul className={styles.history}>
            {history.map((item) => (
              <li key={item.id}>
                <span className={styles.historyMark} aria-hidden="true">✓</span>
                <span className={styles.historyInfo}>
                  <strong>{item.curriculumLessonTitle || item.actualTopic}</strong>
                  <small>{item.actualTopic}</small>
                  {item.completedContent ? <small>{item.completedContent}</small> : null}
                </span>
                <time>{dateLabel(item.completedAt)}</time>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>Chưa có buổi học nào được ghi nhận hoàn thành Lesson.</p>
        )}
      </section>

      <p className={styles.disclaimer}>
        Tiến độ phản ánh các Lesson được giáo viên xác nhận hoàn thành thủ công. Việc điểm danh hoặc lưu biên bản buổi học không tự động cập nhật trạng thái Lesson.
      </p>
    </div>
  );
}

export default function ParentLearningProgressPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Đang tải tiến độ học tập...</div>}>
      <ParentLearningProgressContent />
    </Suspense>
  );
}
