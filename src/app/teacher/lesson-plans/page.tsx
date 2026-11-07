import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentTeacherId } from "@/lib/current-user";
import { getTeacherLessonPlans } from "@/mocks/teacher-lesson-plans";
import { getTeacherPortalData } from "@/mocks/teacher-portal";
import styles from "./lesson-plans.module.css";
import { CopyPlanButton } from "./CopyPlanButton";

export const metadata = { title: "Giáo án | Giáo viên" };

async function LessonPlanList() {
  await connection();
  const currentTeacherId = await getCurrentTeacherId();
  const [plans, portal] = await Promise.all([
    getTeacherLessonPlans(currentTeacherId),
    getTeacherPortalData(currentTeacherId),
  ]);
  const classNames = new Map((portal?.classes ?? []).map((item) => [item.id, item.name]));
  const ownPlans = plans.filter((plan) => plan.teacherId === currentTeacherId);
  const sharedPlans = plans.filter((plan) => plan.teacherId !== currentTeacherId);

  function renderPlan(plan: (typeof plans)[number], shared: boolean) {
    return <article className={styles.card} key={plan.id}>
      <div className={styles.cardMeta}>
        <span className={styles.pill}>{plan.grade ? `Lớp ${plan.grade}` : "Khóa chuyên biệt"}</span>
        <span className={styles.pill}>{plan.status === "ready" ? "Sẵn sàng" : "Bản nháp"}</span>
        <span className={styles.pill}>{shared ? "Admin chia sẻ" : "Của tôi"}</span>
      </div>
      <h2>{plan.title}</h2>
      <p>{plan.unit} · {plan.lesson}</p>
      <p>{plan.duration} phút · {classNames.get(plan.classId) ?? plan.classId}</p>
      <p>{plan.objectives}</p>
      <div className={styles.cardActions}>
        <Link href={`/teacher/lesson-plans/${plan.id}`}>Xem giáo án →</Link>
        {shared ? <CopyPlanButton planId={plan.id} /> : <Link href={`/teacher/lesson-plans/${plan.id}/edit`}>Chỉnh sửa</Link>}
      </div>
    </article>;
  }

  return <>
    <section className={styles.pageHead}>
      <div><p className={styles.eyebrow}>TEACHING RESOURCES</p><h1>Thư viện giáo án</h1><p className={styles.muted}>Giáo án của bạn và những giáo án được Admin chia sẻ riêng cho bạn.</p></div>
      <Link className={styles.primaryLink} href="/teacher/lesson-plans/new">+ Tạo giáo án</Link>
    </section>
    <section className={styles.librarySection}>
      <div className={styles.sectionHeading}><h2>Giáo án của tôi</h2><span>{ownPlans.length} giáo án</span></div>
      {ownPlans.length ? <div className={styles.cards}>{ownPlans.map((plan) => renderPlan(plan, false))}</div> : <div className={styles.empty}>Bạn chưa tạo giáo án nào.</div>}
    </section>
    <section className={styles.librarySection}>
      <div className={styles.sectionHeading}><h2>Giáo án được Admin chia sẻ</h2><span>{sharedPlans.length} giáo án</span></div>
      {sharedPlans.length ? <div className={styles.cards}>{sharedPlans.map((plan) => renderPlan(plan, true))}</div> : <div className={styles.empty}>Hiện chưa có giáo án nào được chia sẻ cho bạn.</div>}
    </section>
  </>;
}

export default function TeacherLessonPlansPage() {
  return <Suspense fallback={<p>Đang tải giáo án...</p>}><LessonPlanList /></Suspense>;
}
