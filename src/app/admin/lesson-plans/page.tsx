import { Suspense } from "react";
import { connection } from "next/server";
import { getAllTeacherLessonPlans } from "@/mocks/teacher-lesson-plans";
import { getTeachers } from "@/mocks/teachers";
import { getCurricula } from "@/mocks/curricula";
import { AdminLessonPlanManager } from "./AdminLessonPlanManager";

export const metadata = { title: "Quản lý giáo án | Admin" };

async function AdminLessonPlanList() {
  await connection();
  const [plans, teachers, curricula] = await Promise.all([
    getAllTeacherLessonPlans(),
    getTeachers(),
    getCurricula(),
  ]);

  return (
    <>
      <section style={{ marginBottom: 20 }}>
        <p style={{ margin: 0, color: "var(--color-primary)", fontSize: 11, fontWeight: 800, letterSpacing: ".12em" }}>LEARNING RESOURCES</p>
        <h1 style={{ margin: "4px 0 6px", color: "var(--color-ink)", fontSize: "clamp(25px,3vw,32px)" }}>Quản lý giáo án</h1>
        <p style={{ margin: 0, color: "var(--color-muted)", fontSize: 13 }}>Kho giáo án trung tâm. Admin xem toàn bộ, lọc theo chương trình và quản lý quyền chia sẻ cho giáo viên.</p>
      </section>
      <AdminLessonPlanManager plans={plans} teachers={teachers} curricula={curricula} />
    </>
  );
}

export default function AdminLessonPlansPage() {
  return <Suspense fallback={<p>Đang tải kho giáo án...</p>}><AdminLessonPlanList /></Suspense>;
}
