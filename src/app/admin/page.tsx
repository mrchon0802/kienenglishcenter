import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AttentionList } from "@/components/dashboard/AttentionList";
import { ClassScoreBars } from "@/components/dashboard/ClassScoreBars";
import { RecentAssignmentsTable } from "@/components/dashboard/RecentAssignmentsTable";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ScheduleList } from "@/components/dashboard/ScheduleList";
import { SummaryStats } from "@/components/dashboard/SummaryStats";
import { TodoList } from "@/components/dashboard/TodoList";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { formatLongDate } from "@/lib/format";
import { getDashboardData } from "@/mocks/dashboard";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Tổng quan | Quản trị" };

async function DashboardContent() {
  await connection(); // số liệu phụ thuộc thời điểm hiện tại và dữ liệu vừa thay đổi
  const now = new Date();
  const data = await getDashboardData(now);
  const subtitle = `${formatLongDate(now)}${data.isMock ? " · Dữ liệu mẫu" : ""}`;

  return (
    <>
      <PageHeader
        title="Xin chào, Giáo viên"
        subtitle={subtitle}
        actions={
          <>
            <Button href="/admin/students/new">+ Thêm học sinh</Button>
            <Button href="/admin/question-bank/new">+ Tạo câu hỏi</Button>
            <Button href="/admin/tuition">Ghi nhận thanh toán</Button>
            <Button href="/admin/assignments/new" variant="primary">
              + Tạo bài tập
            </Button>
          </>
        }
      />
      <SummaryStats summary={data.summary} />
      <div className={styles.grid}>
        <TodoList items={data.todos} />
        <ScheduleList items={data.schedule} />
      </div>
      <div className={styles.grid}>
        <RecentAssignmentsTable rows={data.recentAssignments} />
        <ClassScoreBars scores={data.classScores} />
      </div>
      <div className={styles.grid}>
        <AttentionList students={data.attention} />
        <RevenueChart data={data.revenue} />
      </div>
    </>
  );
}

export default function AdminHomePage() {
  return (
    <Suspense fallback={<p>Đang tải tổng quan...</p>}>
      <DashboardContent />
    </Suspense>
  );
}
