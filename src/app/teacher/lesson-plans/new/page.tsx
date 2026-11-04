import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { DEMO_CENTER_USER } from "@/mocks/teacher-session";
import { getTeacherPortalData } from "@/mocks/teacher-portal";
import { PlanForm } from "../PlanForm";
import styles from "../lesson-plans.module.css";

async function NewPlanContent() {
  await connection();
  const data = await getTeacherPortalData(DEMO_CENTER_USER.teacherId);
  const classes = (data?.classes ?? []).map((item) => ({ id: item.id, name: item.name, grade: item.grade }));
  return <><section className={styles.pageHead}><div><p className={styles.eyebrow}>TEACHING RESOURCES</p><h1>Tạo giáo án mới</h1><p className={styles.muted}>Giáo án chỉ được tạo cho lớp bạn đang phụ trách.</p></div><Link className={styles.back} href="/teacher/lesson-plans">← Danh sách giáo án</Link></section>{classes.length ? <PlanForm classes={classes} /> : <div className={styles.empty}>Bạn chưa được phân công lớp nào nên chưa thể tạo giáo án.</div>}</>;
}
export default function NewTeacherLessonPlanPage() { return <Suspense fallback={<p>Đang tải biểu mẫu...</p>}><NewPlanContent /></Suspense>; }
