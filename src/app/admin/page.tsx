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
import { Button } from "@/components/ui/Button";
import { formatLongDate } from "@/lib/format";
import { getDashboardData } from "@/mocks/dashboard";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Tổng quan | Quản trị" };

async function DashboardContent() {
  await connection();
  const now = new Date();
  const data = await getDashboardData(now);
  const subtitle = `${formatLongDate(now)}${data.isMock ? " · Dữ liệu mẫu" : ""}`;

  return (
    <>
      <section className={styles.welcome}>
        <div className={styles.welcomeCopy}>
          <span className={styles.eyebrow}>ADMIN DASHBOARD</span>
          <h1 className={styles.title}>Hi, Kiến </h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <div className={styles.welcomeMark} aria-hidden="true">
          K
        </div>
      </section>

      <section
        className={styles.quickSection}
        aria-labelledby="quick-actions-title"
      >
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="quick-actions-title">Thao tác nhanh</h2>
            <p>Truy cập nhanh các công việc thường dùng</p>
          </div>
        </div>
        <div className={styles.quickActions}>
          <Button href="/admin/schedule" className={styles.quickButton}>
            <span className={styles.quickIcon} aria-hidden="true">
              +
            </span>
            <span>
              <strong>Xếp lịch dạy</strong>
              <small>Phân công giáo viên và lớp</small>
            </span>
          </Button>
          <Button
            href="/admin/question-bank/new"
            className={styles.quickButton}
          >
            <span className={styles.quickIcon} aria-hidden="true">
              +
            </span>
            <span>
              <strong>Tạo câu hỏi</strong>
              <small>Thêm vào ngân hàng</small>
            </span>
          </Button>
          <Button href="/admin/tuition" className={styles.quickButton}>
            <span className={styles.quickIcon} aria-hidden="true">
              +
            </span>
            <span>
              <strong>Ghi nhận thu</strong>
              <small>Thanh toán học phí</small>
            </span>
          </Button>
          <Button
            href="/admin/assignments/new"
            className={styles.quickButton}
          >
            <span className={styles.quickIcon} aria-hidden="true">
              +
            </span>
            <span>
              <strong>Tạo bài tập</strong>
              <small>Giao bài cho lớp</small>
            </span>
          </Button>
        </div>
      </section>

      <section
        className={styles.overviewSection}
        aria-labelledby="overview-title"
      >
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="overview-title">Tổng quan trung tâm</h2>
            <p>Các chỉ số hoạt động chính</p>
          </div>
        </div>
        <SummaryStats summary={data.summary} />
      </section>

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
