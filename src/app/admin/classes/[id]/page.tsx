import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatScore, formatVND } from "@/lib/format";
import { formatScheduleSlots } from "@/lib/schedule";
import { getClassById, getClassSessions, getClassStudents, getClasses } from "@/mocks/classes";
import { getStudents } from "@/mocks/students";
import { getCourseById } from "@/mocks/courses";
import { getCurrentTeacherAssignment } from "@/mocks/teacher-assignments";
import { getTeacherById } from "@/mocks/teachers";
import { getClassCurriculum } from "@/mocks/class-curriculum";
import { ClassStudentsTable } from "../_components/ClassStudentsTable";
import { EnrollStudentForm } from "../_components/EnrollStudentForm";
import { SessionList } from "../_components/SessionList";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Chi tiết lớp | Quản trị" };

async function ClassDetail({ params }: { params: Promise<{ id: string }> }) {
  // Buổi học mẫu được tính tương đối với ngày hiện tại, chỉ tính ở request time.
  await connection();
  const { id } = await params;
  const cls = await getClassById(id);
  if (!cls) notFound();

  const [students, sessions, allStudents, classes, course, assignment, curriculum] = await Promise.all([
    getClassStudents(id),
    getClassSessions(id),
    getStudents(),
    getClasses(),
    cls.courseId ? getCourseById(cls.courseId) : Promise.resolve(undefined),
    getCurrentTeacherAssignment(id),
    getClassCurriculum(id),
  ]);
  const teacher = assignment ? await getTeacherById(assignment.teacherId) : undefined;
  const currentUnitInfo = curriculum?.units[cls.currentUnit - 1];
  const courseUnitInfo = course?.units[cls.currentUnit - 1];
  const currentLessonInfo = currentUnitInfo?.lessons[(cls.currentLesson ?? 0) - 1];
  const count = students.length;
  const scored = students.filter((s) => s.averageScore > 0); // averageScore = 0 nghĩa là chưa có điểm
  const avgScore = scored.length ? scored.reduce((sum, s) => sum + s.averageScore, 0) / scored.length : 0;
  const avgAttendance = count ? Math.round(students.reduce((sum, s) => sum + s.attendanceRate, 0) / count) : 0;

  const otherClassNames = classes.map((c) => c.name).filter((n) => n !== cls.name);
  const candidates = allStudents
    .filter((s) => s.status === "active" && s.className !== cls.name)
    .map((s) => ({ id: s.id, name: s.fullName, className: s.className }));

  return (
    <>
      <PageHeader
        title={`Lớp ${cls.name}`}
        subtitle={formatScheduleSlots(cls.scheduleSlots, cls.scheduleDays, cls.startTime, cls.endTime)}
        actions={
          <>
            <Button href={`/admin/reports/classes/${cls.id}`}>Báo cáo lớp</Button>
            <Button href={`/admin/classes/${cls.id}/edit`}>Sửa lớp</Button>
            <Button href="/admin/classes">Về danh sách lớp</Button>
          </>
        }
      />

      <div className={styles.overviewGrid}>
        <Card title="Giáo viên phụ trách">
          {teacher ? (
            <div className={styles.overviewContent}>
              <div className={styles.teacherIdentity}>
                <span className={styles.teacherAvatar}>
                  {teacher.fullName.split(" ").slice(-1)[0]?.charAt(0) ?? "G"}
                </span>
                <div className={styles.overviewText}>
                  <strong>{teacher.fullName}</strong>
                  <span>{teacher.teacherCode}</span>
                </div>
              </div>
              <div className={styles.overviewMeta}>
                <span>Ngày bắt đầu phụ trách</span>
                <strong>{assignment?.startDate ? new Intl.DateTimeFormat("vi-VN").format(new Date(`${assignment.startDate}T00:00:00`)) : "Chưa cập nhật"}</strong>
              </div>
              <Button href={`/admin/classes/${cls.id}/edit`}>Thay đổi giáo viên</Button>
            </div>
          ) : (
            <div className={styles.overviewContent}>
              <p className={styles.muted}>Lớp chưa được phân công giáo viên phụ trách.</p>
              <Button href={`/admin/classes/${cls.id}/edit`}>Phân công giáo viên</Button>
            </div>
          )}
        </Card>

        <Card title="Tiến trình học tập">
          <div className={styles.overviewContent}>
            <div className={styles.progressSummary}>
              <div>
                <span>Unit hiện tại</span>
                <strong>Unit {cls.currentUnit}</strong>
                <small>{currentUnitInfo?.title ?? courseUnitInfo?.title ?? "Chưa có tên Unit"}</small>
              </div>
              <div>
                <span>Lesson hiện tại</span>
                <strong>{cls.currentLesson ? `Lesson ${cls.currentLesson}` : "Chưa cập nhật"}</strong>
                <small>{currentLessonInfo?.title ?? (cls.currentLesson ? "Theo tiến độ lớp" : "Cập nhật trong Sửa lớp")}</small>
              </div>
            </div>
            {currentUnitInfo?.lessons?.length ? (
              <div className={styles.lessonProgress}>
                <div className={styles.lessonProgressHeader}>
                  <span>Tiến độ trong Unit</span>
                  <strong>{cls.currentLesson ?? 0}/{currentUnitInfo.lessons.length} Lesson</strong>
                </div>
                <div className={styles.progressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={currentUnitInfo.lessons.length} aria-valuenow={Math.min(cls.currentLesson ?? 0, currentUnitInfo.lessons.length)}>
                  <span style={{ width: `${Math.min(100, ((cls.currentLesson ?? 0) / currentUnitInfo.lessons.length) * 100)}%` }} />
                </div>
              </div>
            ) : null}
            <Button href={`/admin/classes/${cls.id}/edit`}>Cập nhật tiến trình</Button>
          </div>
        </Card>
      </div>

      {course ? (
        <Card title="Khóa học đang áp dụng">
          <p><strong>{course.name}</strong> · {course.level}</p>
          <p>{course.totalSessions} buổi · {course.durationWeeks} tuần · Học phí chuẩn {formatVND(course.standardFee)}</p>
          <Button href={`/admin/courses/${course.id}`}>Xem khóa học</Button>
        </Card>
      ) : null}

      <div className={styles.stats}>
        <StatCard label="Sĩ số" value={String(count)} hint={`Đang học Unit ${cls.currentUnit}`} />
        <StatCard label="Điểm trung bình lớp" value={scored.length ? formatScore(avgScore) : "-"} hint="Tất cả bài đã chấm" />
        <StatCard label="Chuyên cần trung bình" value={count ? `${avgAttendance}%` : "-"} hint="Tính từ đầu khóa" />
      </div>

      <div className={styles.grid}>
        <Card title="Học sinh trong lớp">
          <ClassStudentsTable students={students} otherClassNames={otherClassNames} />
        </Card>
        <Card title="Các buổi học gần đây">
          <SessionList sessions={sessions} />
        </Card>
      </div>

      <Card title="Ghi danh học sinh vào lớp">
        <EnrollStudentForm className={cls.name} candidates={candidates} />
      </Card>
    </>
  );
}

export default function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Đang tải thông tin lớp...</p>}>
      <ClassDetail params={params} />
    </Suspense>
  );
}
