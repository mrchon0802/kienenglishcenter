import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentTeacherId } from "@/lib/current-user";
import { getTeacherPortalData } from "@/mocks/teacher-portal";
import { getCurricula } from "@/mocks/curricula";
import { PlanForm } from "../PlanForm";
import styles from "../lesson-plans.module.css";

async function NewPlanContent() {
  await connection();
  const currentTeacherId = await getCurrentTeacherId();
  const [data, curricula] = await Promise.all([getTeacherPortalData(currentTeacherId), getCurricula()]);
  const classes = (data?.classes ?? []).map((item) => ({ id: item.id, name: item.name, grade: item.grade }));
  return <><section className={styles.pageHead}><div><p className={styles.eyebrow}>TEACHING RESOURCES</p><h1>Tạo giáo án mới</h1><p className={styles.muted}>Bạn có thể soạn giáo án cho mọi lớp 1–9 và các chương trình chuyên biệt.</p></div><Link className={styles.back} href="/teacher/lesson-plans">← Danh sách giáo án</Link></section><PlanForm classes={classes} curricula={curricula} /></>;
}
export default function NewTeacherLessonPlanPage() { return <Suspense fallback={<p>Đang tải biểu mẫu...</p>}><NewPlanContent /></Suspense>; }
