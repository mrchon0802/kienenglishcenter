import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentTeacherId } from "@/lib/current-user";
import { getTeacherLessonPlanById } from "@/mocks/teacher-lesson-plans";
import { getClassById } from "@/mocks/classes";
import styles from "../lesson-plans.module.css";
import { CopyPlanButton } from "../CopyPlanButton";

type PageParams = Promise<{ planId: string }>;

async function PlanDetail({ params }: { params: PageParams }) {
  await connection();
  const currentTeacherId = await getCurrentTeacherId();
  const { planId } = await params;
  const plan = await getTeacherLessonPlanById(planId, currentTeacherId);
  if (!plan) notFound();
  const cls = await getClassById(plan.classId);
  const sections = [
    ["Mục tiêu bài học", plan.objectives], ["Học liệu / thiết bị", plan.materials], ["Khởi động (Warm-up)", plan.warmUp],
    ["Giới thiệu kiến thức (Presentation)", plan.presentation], ["Luyện tập (Practice)", plan.practice],
    ["Vận dụng (Production)", plan.production], ["Bài tập về nhà", plan.homework],
  ];
  return <><section className={styles.pageHead}><div><p className={styles.eyebrow}>LESSON PLAN · {plan.grade ? `LỚP ${plan.grade}` : "KHÓA HỌC"}</p><h1>{plan.title}</h1><p className={styles.muted}>{plan.unit} · {plan.lesson} · {plan.duration} phút</p></div><Link className={styles.back} href="/teacher/lesson-plans">← Danh sách giáo án</Link></section><article className={styles.detail}><div className={styles.cardMeta}><span className={styles.pill}>{plan.status === "ready" ? "Sẵn sàng" : "Bản nháp"}</span><span className={styles.pill}>{plan.visibility === "shared" ? "Đã chia sẻ" : "Riêng tư"}</span><span className={styles.pill}>Khối {plan.grade}</span></div>{sections.map(([title, content]) => <section className={styles.detailSection} key={title}><h3>{title}</h3><p>{content || "Chưa cập nhật."}</p></section>)}<div className={styles.cardActions}>{plan.teacherId === currentTeacherId ? <Link href={`/teacher/lesson-plans/${plan.id}/edit`}>Chỉnh sửa giáo án</Link> : <CopyPlanButton planId={plan.id} />}</div></article></>;
}

export default function TeacherLessonPlanDetailPage({ params }: { params: PageParams }) {
  return <Suspense fallback={<p>Đang tải giáo án...</p>}><PlanDetail params={params} /></Suspense>;
}
