import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { getCourses, getCourseUsage } from "@/mocks/courses";
import { CourseDirectory } from "./_components/CourseDirectory";
import styles from "./page.module.css";

export const metadata = { title: "Quản lý khóa học | Quản trị" };

async function CoursesContent() {
  await connection();
  const courses = await getCourses();
  const usages = await Promise.all(courses.map(async (course) => [course.id, await getCourseUsage(course.id)] as const));
  const usage = Object.fromEntries(usages.map(([id, data]) => [id, { classCount: data.classes.length, studentCount: data.studentCount }]));
  const active = courses.filter((course) => course.status === "active").length;
  const totalSessions = courses.reduce((sum, course) => sum + course.totalSessions, 0);
  return <>
    <PageHeader title="Quản lý khóa học" subtitle="Quản lý chương trình học độc lập và liên kết với các lớp." actions={<Button href="/admin/courses/new" variant="primary">+ Tạo khóa học</Button>} />
    <div className={styles.stats}>
      <div className={styles.stat}><strong>{courses.length}</strong><span>Tổng khóa học</span></div>
      <div className={styles.stat}><strong>{active}</strong><span>Đang hoạt động</span></div>
      <div className={styles.stat}><strong>{Object.values(usage).reduce((sum, item) => sum + item.classCount, 0)}</strong><span>Lớp đang sử dụng</span></div>
      <div className={styles.stat}><strong>{totalSessions}</strong><span>Tổng buổi học tiêu chuẩn</span></div>
    </div>
    <CourseDirectory courses={courses} usage={usage} />
  </>;
}

export default function CoursesPage() {
  return <Suspense fallback={<p>Đang tải danh sách khóa học...</p>}><CoursesContent /></Suspense>;
}
