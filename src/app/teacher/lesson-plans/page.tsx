import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { DEMO_CENTER_USER } from "@/mocks/teacher-session";
import { getTeacherLessonPlans } from "@/mocks/teacher-lesson-plans";
import { getTeacherPortalData } from "@/mocks/teacher-portal";
import styles from "./lesson-plans.module.css";

export const metadata = { title: "Giáo án | Giáo viên" };

async function LessonPlanList() {
  await connection();
  const [plans, portal] = await Promise.all([
    getTeacherLessonPlans(DEMO_CENTER_USER.teacherId),
    getTeacherPortalData(DEMO_CENTER_USER.teacherId),
  ]);
  const classNames = new Map((portal?.classes ?? []).map((item) => [item.id, item.name]));
  return <>
    <section className={styles.pageHead}><div><p className={styles.eyebrow}>TEACHING RESOURCES</p><h1>Giáo án của tôi</h1><p className={styles.muted}>Tạo, cập nhật và chia sẻ giáo án cho các lớp đang phụ trách.</p></div><Link className={styles.primaryLink} href="/teacher/lesson-plans/new">+ Tạo giáo án</Link></section>
    {plans.length ? <div className={styles.cards}>{plans.map((plan) => <article className={styles.card} key={plan.id}>
      <div className={styles.cardMeta}><span className={styles.pill}>Lớp {classNames.get(plan.classId) ?? plan.classId.toUpperCase()}</span><span className={styles.pill}>{plan.status === "ready" ? "Sẵn sàng" : "Bản nháp"}</span><span className={styles.pill}>{plan.visibility === "shared" ? "Đã chia sẻ" : "Riêng tư"}</span></div>
      <h2>{plan.title}</h2><p>{plan.unit} · {plan.lesson}</p><p>{plan.duration} phút · Khối {plan.grade}</p><p>{plan.objectives}</p>
      <div className={styles.cardActions}><Link href={`/teacher/lesson-plans/${plan.id}`}>Xem giáo án →</Link>{plan.teacherId === DEMO_CENTER_USER.teacherId ? <Link href={`/teacher/lesson-plans/${plan.id}/edit`}>Chỉnh sửa</Link> : null}</div>
    </article>)}</div> : <div className={styles.empty}>Bạn chưa có giáo án nào. Hãy tạo giáo án đầu tiên cho lớp đang phụ trách.</div>}
  </>;
}
export default function TeacherLessonPlansPage() { return <Suspense fallback={<p>Đang tải giáo án...</p>}><LessonPlanList /></Suspense>; }
