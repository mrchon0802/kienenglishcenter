import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { formatVND } from "@/lib/format";
import { getCourseById, getCourseUsage } from "@/mocks/courses";
import styles from "./page.module.css";

export const metadata = { title: "Chi tiết khóa học | Quản trị" };

async function CourseDetail({ id }: { id: string }) {
  await connection();
  const course = await getCourseById(id);
  if (!course) notFound();
  const usage = await getCourseUsage(id);
  return (
    <>
      <PageHeader
        title="Chi tiết khóa học"
        subtitle="Thông tin chương trình và các lớp đang áp dụng."
        actions={
          <>
            <Button href={`/admin/courses/${id}/edit`}>Chỉnh sửa</Button>
            <Button href="/admin/courses">Danh sách khóa học</Button>
          </>
        }
      />
      <section className={styles.hero}>
        <div>
          <span className={styles.code}>
            {course.code} · {course.level}
          </span>
          <h2>{course.name}</h2>
          <p>{course.description || "Chưa có mô tả."}</p>
        </div>
        <span className={styles.badge}>
          {course.status === "active" ? "Đang hoạt động" : "Ngừng hoạt động"}
        </span>
      </section>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span>Thời lượng</span>
          <strong>{course.durationWeeks} tuần</strong>
        </div>
        <div className={styles.stat}>
          <span>Tổng số buổi</span>
          <strong>{course.totalSessions} buổi</strong>
        </div>
        <div className={styles.stat}>
          <span>Học phí tiêu chuẩn</span>
          <strong>{formatVND(course.standardFee)}</strong>
        </div>
        <div className={styles.stat}>
          <span>Số học viên</span>
          <strong>{usage.studentCount}</strong>
        </div>
      </div>
      <section className={styles.section}>
        <h2>Mục tiêu học tập</h2>
        {course.objectives.length ? (
          <ul>
            {course.objectives.map((objective, index) => (
              <li key={index}>{objective}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>Chưa có mục tiêu học tập.</p>
        )}
      </section>
      <section className={styles.section}>
        <h2>Chương trình học · {course.units.length} Unit</h2>
        <div className={styles.unitList}>
          {course.units.map((unit, index) => (
            <div className={styles.unit} key={unit.id}>
              <strong>
                {index + 1}. {unit.title}
              </strong>
              <span>{unit.lessons} bài học</span>
            </div>
          ))}
        </div>
      </section>
      <section className={styles.section}>
        <h2>Các lớp đang sử dụng khóa học</h2>
        {usage.classes.length ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Lớp</th>
                <th>Sĩ số</th>
                <th>Học phí lớp</th>
                <th>Tiến độ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {usage.classes.map((cls) => (
                <tr key={cls.id}>
                  <td>{cls.name}</td>
                  <td>{cls.studentCount}</td>
                  <td>{formatVND(cls.monthlyFee)}/tháng</td>
                  <td>Unit {cls.currentUnit}</td>
                  <td>
                    <Link href={`/admin/classes/${cls.id}`}>Xem lớp</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.empty}>
            Chưa có lớp nào được gắn với khóa học này. Bạn có thể chọn khóa học
            khi tạo hoặc chỉnh sửa lớp.
          </p>
        )}
      </section>
    </>
  );
}

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p>Đang tải chi tiết khóa học...</p>}>
      <CourseDetailContent params={params} />
    </Suspense>
  );
}

async function CourseDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CourseDetail id={id} />;
}
