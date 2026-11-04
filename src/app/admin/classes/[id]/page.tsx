import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatScore } from "@/lib/format";
import { formatSchedule } from "@/lib/schedule";
import { getClassById, getClassSessions, getClassStudents, getClasses } from "@/mocks/classes";
import { getStudents } from "@/mocks/students";
import { ClassStudentsTable } from "../_components/ClassStudentsTable";
import { EnrollStudentForm } from "../_components/EnrollStudentForm";
import { SessionList } from "../_components/SessionList";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Chi tiết lớp | Quản trị" };

async function ClassDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cls = await getClassById(id);
  if (!cls) notFound();

  const [students, sessions, allStudents, classes] = await Promise.all([
    getClassStudents(id),
    getClassSessions(id),
    getStudents(),
    getClasses(),
  ]);
  const count = students.length;
  const scored = students.filter((s) => s.averageScore > 0); // averageScore = 0 nghĩa là chưa có điểm
  const avgScore = scored.length ? scored.reduce((sum, s) => sum + s.averageScore, 0) / scored.length : 0;
  const avgAttendance = count ? Math.round(students.reduce((sum, s) => sum + s.attendanceRate, 0) / count) : 0;

  const otherClassNames = classes.map((c) => c.name).filter((n) => n !== cls.name);
  const candidates = allStudents
    .filter((s) => s.status === "active" && s.className !== cls.name)
    .map((s) => ({ id: s.id, name: s.fullName, className: s.className }));

  return (
    <>
      <PageHeader
        title={`Lớp ${cls.name}`}
        subtitle={formatSchedule(cls.scheduleDays, cls.startTime, cls.endTime)}
        actions={
          <>
            <Button href={`/admin/reports/classes/${cls.id}`}>Báo cáo lớp</Button>
            <Button href={`/admin/classes/${cls.id}/edit`}>Sửa lớp</Button>
            <Button href="/admin/classes">Về danh sách lớp</Button>
          </>
        }
      />

      <div className={styles.stats}>
        <StatCard label="Sĩ số" value={String(count)} hint={`Đang học Unit ${cls.currentUnit}`} />
        <StatCard label="Điểm trung bình lớp" value={scored.length ? formatScore(avgScore) : "-"} hint="Tất cả bài đã chấm" />
        <StatCard label="Chuyên cần trung bình" value={count ? `${avgAttendance}%` : "-"} hint="Tính từ đầu khóa" />
      </div>

      <div className={styles.grid}>
        <Card title="Học sinh trong lớp">
          <ClassStudentsTable students={students} otherClassNames={otherClassNames} />
        </Card>
        <Card title="Các buổi học gần đây">
          <SessionList sessions={sessions} />
        </Card>
      </div>

      <Card title="Ghi danh học sinh vào lớp">
        <EnrollStudentForm className={cls.name} candidates={candidates} />
      </Card>
    </>
  );
}

export default function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Đang tải thông tin lớp...</p>}>
      <ClassDetail params={params} />
    </Suspense>
  );
}
