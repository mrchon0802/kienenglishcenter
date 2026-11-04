import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { DEMO_CENTER_USER } from "@/mocks/teacher-session";
import { getTeacherPortalData } from "@/mocks/teacher-portal";
import { getAssignmentById, getEssayGradingItems } from "@/mocks/assignments";
import { GradingQueue } from "./GradingQueue";
import styles from "../../assignments.module.css";

export const metadata = { title: "Chấm bài tự luận | Giáo viên" };

async function GradingPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  await connection();
  const { assignmentId } = await params;
  const [assignment, portal] = await Promise.all([getAssignmentById(assignmentId), getTeacherPortalData(DEMO_CENTER_USER.teacherId)]);
  if (!assignment || !portal?.classes.some((item) => item.id === assignment.classId)) notFound();
  const items = await getEssayGradingItems(assignment);
  return <div className={styles.package7Page}>
    <div className={styles.pageHead}><div><p className={styles.eyebrow}>TEACHING TOOLS / GRADING</p><h1>Chấm bài tự luận</h1><p className={styles.muted}>{assignment.title}</p></div><Link className={styles.secondaryLink} href={`/teacher/assignments/${assignment.id}`}>← Quay lại kết quả</Link></div>
    <GradingQueue items={items} />
  </div>;
}

export default function TeacherGradingPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  return <Suspense fallback={<p>Đang tải danh sách chấm bài...</p>}><GradingPage params={params} /></Suspense>;
}
