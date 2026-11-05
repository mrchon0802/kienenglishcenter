import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { getCurricula, getCurriculumTargetLabel } from "@/mocks/curricula";
import { CurriculumDirectory } from "./_components/CurriculumDirectory";
import styles from "./page.module.css";

export const metadata = { title: "Quản lý giáo trình | Quản trị" };

async function CurriculumContent() {
  await connection();
  const curricula = await getCurricula();
  const labels = await Promise.all(curricula.map(async (item) => [item.id, await getCurriculumTargetLabel(item)] as const));
  const targetLabels = Object.fromEntries(labels);
  const active = curricula.filter((item) => item.status === "active").length;
  const gradeCount = curricula.filter((item) => item.targetType === "grade").length;
  const lessonCount = curricula.reduce((sum, item) => sum + item.units.reduce((unitSum, unit) => unitSum + unit.lessons.length, 0), 0);
  return <>
    <PageHeader title="Quản lý giáo trình" subtitle="Xây dựng nội dung giảng dạy theo khối lớp hoặc khóa học chuyên biệt." actions={<Button href="/admin/curriculum/new" variant="primary">+ Tạo giáo trình</Button>} />
    <div className={styles.stats}>
      <div className={styles.stat}><strong>{curricula.length}</strong><span>Tổng giáo trình</span></div>
      <div className={styles.stat}><strong>{active}</strong><span>Đang sử dụng</span></div>
      <div className={styles.stat}><strong>{gradeCount}</strong><span>Giáo trình theo khối</span></div>
      <div className={styles.stat}><strong>{lessonCount}</strong><span>Tổng Lesson</span></div>
    </div>
    <CurriculumDirectory curricula={curricula} targetLabels={targetLabels} />
  </>;
}

export default function CurriculumPage() {
  return <Suspense fallback={<p>Đang tải danh sách giáo trình...</p>}><CurriculumContent /></Suspense>;
}
