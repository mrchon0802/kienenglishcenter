import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/format-datetime";
import { formatScore } from "@/lib/format";
import { getCurrentStudentId } from "@/lib/current-user";
import { getStudentProgress } from "@/mocks/student-progress";
import styles from "./progress.module.css";

export const metadata: Metadata = { title: "Tiến độ học tập | Học sinh" };

async function ProgressContent() {
  await connection();
  const currentStudentId = await getCurrentStudentId();
  const data = await getStudentProgress(currentStudentId, new Date());
  if (!data) return <EmptyState title="Không tìm thấy hồ sơ học sinh" />;
  const scored = data.assignments.filter((item) => item.bestScore !== null);
  return (
    <>
      <PageHeader title="Tiến độ học tập" subtitle={`Theo dõi quá trình học tập của ${data.studentName} · Lớp ${data.className}`} />
      <section className={styles.stats} aria-label="Tổng quan tiến độ">
        <article><span>Chuyên cần</span><strong>{data.attendanceRate === null ? "Chưa có" : `${data.attendanceRate}%`}</strong><small>{data.attendedSessions}/{data.markedSessions} buổi đã điểm danh</small></article>
        <article><span>Bài tập hoàn thành</span><strong>{data.completedAssignments}/{data.totalAssignments}</strong><small>{data.upcomingCount} bài đang chờ làm</small></article>
        <article><span>Điểm trung bình</span><strong>{data.averageScore === null ? "Chưa có" : formatScore(data.averageScore)}</strong><small>{scored.length} bài đã có điểm</small></article>
        <article><span>Buổi học ghi nhận</span><strong>{data.totalSessions}</strong><small>Trong lịch sử lớp hiện tại</small></article>
      </section>
      <Card title="Kết quả bài tập">
        {scored.length ? <div className={styles.scoreList}>{scored.map((item) => <div className={styles.scoreRow} key={item.id}><div><strong>{item.title}</strong><small>{item.kind === "test" ? "Kiểm tra" : "Luyện tập"} · Hạn {formatDateTime(item.dueAt)}</small></div><strong className={styles.score}>{formatScore(item.bestScore ?? 0)}</strong></div>)}</div> : <EmptyState title="Chưa có kết quả" description="Điểm sẽ xuất hiện tại đây sau khi em hoàn thành bài và được chấm." />}
        <p className={styles.note}><Link href="/student/scores">Xem trang điểm số →</Link></p>
      </Card>
      <Card title="Bài tập cần chú ý">
        {data.assignments.filter((item) => item.status !== "done").length ? <div className={styles.assignmentList}>{data.assignments.filter((item) => item.status !== "done").map((item) => <div className={styles.assignmentRow} key={item.id}><div><strong>{item.title}</strong><small>Hạn nộp: {formatDateTime(item.dueAt)}</small></div><div className={styles.assignmentMeta}><Badge tone={item.status === "missed" ? "amber" : "teal"}>{item.status === "missed" ? "Quá hạn" : "Chưa làm"}</Badge><Link href={`/student/assignments/${item.id}`}>Mở bài →</Link></div></div>)}</div> : <EmptyState title="Em đã hoàn thành tất cả bài tập" />}
      </Card>
      <Card title="Lịch sử buổi học">
        {data.lessons.length ? <div className={styles.lessonList}>{data.lessons.map((lesson) => <article className={styles.lesson} key={lesson.id}><div className={styles.lessonDate}>{formatDateTime(`${lesson.date}T00:00`)}</div><div className={styles.lessonBody}><strong>{lesson.actualTopic || lesson.topic}</strong>{lesson.completedContent ? <p>{lesson.completedContent}</p> : <p className={styles.muted}>Chưa có nội dung tổng kết từ giáo viên.</p>}{lesson.homework ? <p><b>Bài tập về nhà:</b> {lesson.homework}</p> : null}</div><Badge tone={lesson.attended === false ? "amber" : "teal"}>{lesson.attended === null ? "Chưa điểm danh" : lesson.attended ? "Có tham gia" : "Vắng"}</Badge></article>)}</div> : <EmptyState title="Chưa có lịch sử buổi học" />}
      </Card>
      <p className={styles.disclaimer}>Dữ liệu được tổng hợp từ bài tập, điểm danh và biên bản buổi học hiện có. Tỷ lệ chuyên cần chỉ tính các buổi đã có trạng thái điểm danh.</p>
    </>
  );
}

export default function StudentProgressPage() {
  return <><Suspense fallback={<p>Đang tải tiến độ học tập...</p>}><ProgressContent /></Suspense></>;
}
