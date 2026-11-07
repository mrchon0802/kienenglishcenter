import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentTeacherId } from "@/lib/current-user";
import { getTeacherLessonPlanById } from "@/mocks/teacher-lesson-plans";
import { getTeacherPortalData } from "@/mocks/teacher-portal";
import { getCurricula } from "@/mocks/curricula";
import { PlanForm } from "../../PlanForm";
import styles from "../../lesson-plans.module.css";

type PageParams = Promise<{ planId: string }>;

async function EditPlanContent({ params }: { params: PageParams }) {
  await connection();
  const currentTeacherId = await getCurrentTeacherId();
  const { planId } = await params;
  const [plan, portal, curricula] = await Promise.all([
    getTeacherLessonPlanById(planId, currentTeacherId),
    getTeacherPortalData(currentTeacherId),
    getCurricula(),
  ]);
  if (!plan || plan.teacherId !== currentTeacherId) notFound();
  const classes = (portal?.classes ?? []).map((item) => ({ id: item.id, name: item.name, grade: item.grade }));
  return <><section className={styles.pageHead}><div><p className={styles.eyebrow}>TEACHING RESOURCES</p><h1>Chỉnh sửa giáo án</h1><p className={styles.muted}>{plan.title}</p></div><Link className={styles.back} href={`/teacher/lesson-plans/${plan.id}`}>← Quay lại giáo án</Link></section><PlanForm classes={classes} curricula={curricula} initial={plan} /></>;
}

export default function EditTeacherLessonPlanPage({ params }: { params: PageParams }) {
  return <Suspense fallback={<p>Đang tải biểu mẫu...</p>}><EditPlanContent params={params} /></Suspense>;
}
