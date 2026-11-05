import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card } from "@/components/ui/Card";
import { formatScore } from "@/lib/format";
import { getStudentAssignments } from "@/mocks/assignments";
import { CURRENT_STUDENT_ID } from "@/mocks/session";
import { getStudentById } from "@/mocks/students";
import { StudentAssignmentList } from "./assignments/_components/StudentAssignmentList";
import styles from "./page.module.css";
import Link from "next/link";

export const metadata: Metadata = { title: "Trang chủ | Học sinh" };

async function StudentHome() {
  await connection(); // dữ liệu bài tập thay đổi theo từng lần truy cập
  const [student, assignments] = await Promise.all([
    getStudentById(CURRENT_STUDENT_ID),
    getStudentAssignments(CURRENT_STUDENT_ID, new Date()),
  ]);
  if (!student) return <p>Không tìm thấy học sinh.</p>;

  const firstName = student.fullName.split(" ").slice(-1)[0];
  const todo = assignments.filter((a) => a.status === "todo");
  const unpaid = student.tuitionStatus === "unpaid";

  return (
    <>
      <div>
        <h1 className={styles.title}>Chào {firstName}!</h1>
        <p className={styles.subtitle}>
          Lớp {student.className} ·{" "}
          {todo.length > 0
            ? `Bạn có ${todo.length} bài cần làm`
            : "Bạn đã làm hết bài rồi"}{" "}
          · Dữ liệu mẫu
        </p>
      </div>

      <div className={styles.stats}>
        <StatCard
          label="Điểm trung bình"
          value={
            student.averageScore > 0
              ? formatScore(student.averageScore)
              : "Chưa có"
          }
          hint="Tất cả bài đã chấm"
        />
        <StatCard
          label="Đi học đầy đủ"
          value={`${student.attendanceRate}%`}
          hint="Tính từ đầu khóa"
        />
        <StatCard
          label="Học phí tháng này"
          value={unpaid ? "Chưa đóng" : "Đã đóng"}
          hint={unpaid ? "Nhờ ba mẹ đóng học phí nhé" : "Không có công nợ"}
          tone={unpaid ? "warning" : "default"}
        />
      </div>

      <Card title="Tiến độ học tập">
        <p>
          Theo dõi chuyên cần, kết quả bài tập và lịch sử các buổi học của em.
        </p>
        <Link href="/student/progress">Xem tiến độ học tập →</Link>
      </Card>

      <Card title="Việc cần làm">
        <StudentAssignmentList
          items={todo}
          emptyTitle="Tuyệt vời! Bạn không còn bài nào cần làm."
        />
      </Card>

      <Card title="Không gian học tập">
        <div className={styles.learningLinks}>
          <Link href="/student/materials"><strong>Thư viện học liệu</strong><span>Ôn từ vựng, ngữ pháp và phát âm theo chủ đề.</span></Link>
          <Link href="/student/goals"><strong>Mục tiêu học tập</strong><span>Đặt mục tiêu và cập nhật tiến độ của em.</span></Link>
          <Link href="/student/assignments"><strong>Luyện tập & kiểm tra</strong><span>Tiếp tục làm bài tập và xem kết quả.</span></Link>
        </div>
      </Card>
    </>
  );
}

export default function StudentHomePage() {
  return (
    <Suspense fallback={<p>Đang tải...</p>}>
      <StudentHome />
    </Suspense>
  );
}
