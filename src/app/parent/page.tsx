import type { Metadata } from "next";
import { connection } from "next/server";
import { getCurrentStudentId } from "@/lib/current-user";
import { getStudentById } from "@/mocks/students";
import { getStudentProgress } from "@/mocks/student-progress";
import { getAssessmentsForStudent } from "@/mocks/student-assessments";
import { getStudentInvoiceViews, getStudentPayments } from "@/mocks/tuition";
import { getStudentNotifications } from "@/mocks/student-notifications";
import { formatScore, formatVND } from "@/lib/format";
import { Suspense } from "react";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Tổng quan phụ huynh | Kien English Center",
};

function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function dateLabel(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
}

async function ParentDashboard() {
  await connection();
  const currentStudentId = await getCurrentStudentId();
  const student = await getStudentById(currentStudentId);
  if (!student)
    return (
      <section className={styles.notice}>
        <h1>Không tìm thấy hồ sơ học sinh</h1>
        <p>Vui lòng liên hệ trung tâm để kiểm tra tài khoản.</p>
      </section>
    );

  if (!student.parentAccessEnabled) {
    return (
      <section className={styles.notice} role="status">
        <span className={styles.eyebrow}>PARENT PORTAL</span>
        <h1>Quyền truy cập chưa được kích hoạt</h1>
        <p>
          Tài khoản hiện được liên kết với <strong>{student.fullName}</strong>,
          nhưng trung tâm chưa bật quyền truy cập dành cho phụ huynh.
        </p>
        <p>Vui lòng liên hệ trung tâm hoặc quản trị viên để được hỗ trợ.</p>
      </section>
    );
  }

  const today = todayISO();
  const [progress, assessments, invoices, payments, notifications] =
    await Promise.all([
      getStudentProgress(student.id, new Date()),
      getAssessmentsForStudent(student.id),
      getStudentInvoiceViews(student.id, today),
      getStudentPayments(student.id),
      getStudentNotifications(student.id),
    ]);

  const latestAssessment = assessments[0];
  const assessmentAverage = latestAssessment
    ? Object.values(latestAssessment.scores).reduce(
        (sum, score) => sum + score,
        0,
      ) / 4
    : null;
  const outstanding = invoices.reduce(
    (sum, invoice) => sum + invoice.remaining,
    0,
  );
  const latestInvoices = invoices.slice(0, 3);
  const latestPayments = payments.slice(0, 3);
  const pendingAssignments =
    progress?.assignments.filter(
      (item) => item.status === "todo" || item.status === "missed",
    ) ?? [];
  const unreadNotifications = notifications.filter((item) => !item.readAt);
  const firstName = student.fullName.split(" ").slice(-1)[0];

  return (
    <div className={styles.dashboard}>
      <section className={styles.welcome}>
        <div>
          <span className={styles.eyebrow}>PARENT PORTAL</span>
          <h1>Xin chào {student.parentName || "quý phụ huynh"}!</h1>
          <p>
            Dưới đây là tình hình học tập gần đây của{" "}
            <strong>{student.fullName}</strong>.
          </p>
        </div>
        <div className={styles.studentChip}>
          <span className={styles.studentAvatar}>
            {student.fullName
              .split(" ")
              .slice(-2)
              .map((part) => part[0])
              .join("")}
          </span>
          <span>
            <strong>{student.fullName}</strong>
            <small>
              Lớp {student.className} · {student.code}
            </small>
          </span>
        </div>
      </section>

      <section className={styles.stats} aria-label="Tổng quan học tập">
        <article className={styles.stat}>
          <span>Chuyên cần</span>
          <strong>
            {progress?.attendanceRate == null
              ? "Chưa có"
              : `${progress.attendanceRate}%`}
          </strong>
          <small>
            {progress
              ? `${progress.attendedSessions}/${progress.markedSessions} buổi có mặt`
              : "Chưa có dữ liệu"}
          </small>
        </article>
        <article className={styles.stat}>
          <span>Điểm trung bình bài tập</span>
          <strong>
            {progress?.averageScore == null
              ? "Chưa có"
              : formatScore(progress.averageScore)}
          </strong>
          <small>Dựa trên bài đã được chấm</small>
        </article>
        <article className={styles.stat}>
          <span>Đánh giá năng lực gần nhất</span>
          <strong>
            {assessmentAverage == null
              ? "Chưa có"
              : formatScore(assessmentAverage)}
          </strong>
          <small>
            {latestAssessment
              ? `Ngày ${dateLabel(latestAssessment.assessedAt)}`
              : "Chưa có đánh giá"}
          </small>
        </article>
        <article className={styles.stat}>
          <span>Tiến độ bài tập</span>
          <strong>
            {progress
              ? `${progress.completedAssignments}/${progress.totalAssignments}`
              : "—"}
          </strong>
          <small>{pendingAssignments.length} bài cần chú ý</small>
        </article>
      </section>

      <div className={styles.columns}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2>Học tập cần chú ý</h2>
              <p>Các bài tập chưa hoàn thành hoặc đã quá hạn</p>
            </div>
            <span className={styles.count}>{pendingAssignments.length}</span>
          </div>
          {pendingAssignments.length ? (
            <ul className={styles.assignmentList}>
              {pendingAssignments.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <span>
                    <strong>{item.title}</strong>
                    <small>Hạn nộp: {dateLabel(item.dueAt)}</small>
                  </span>
                  <span
                    className={
                      item.status === "missed" ? styles.danger : styles.pending
                    }
                  >
                    {item.status === "missed" ? "Quá hạn" : "Chưa làm"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>Hiện không có bài tập nào cần chú ý.</p>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2>Học phí</h2>
              <p>Tổng số tiền còn phải thanh toán</p>
            </div>
            <span className={styles.moneyIcon}>₫</span>
          </div>
          <strong className={styles.outstanding}>
            {formatVND(outstanding)}
          </strong>
          <p className={styles.muted}>
            {invoices.filter((invoice) => invoice.remaining > 0).length} khoản
            còn dư nợ · {invoices.length} hóa đơn trong dữ liệu
          </p>
          {latestInvoices.length ? (
            <ul className={styles.compactList}>
              {latestInvoices.map((invoice) => (
                <li key={invoice.id}>
                  <span>{invoice.month}</span>
                  <strong
                    className={
                      invoice.remaining > 0 ? styles.danger : styles.paid
                    }
                  >
                    {invoice.remaining > 0
                      ? `Còn ${formatVND(invoice.remaining)}`
                      : "Đã thanh toán"}
                  </strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>Chưa có hóa đơn học phí.</p>
          )}
        </section>
      </div>

      <div className={styles.columns}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2>Đánh giá năng lực gần nhất</h2>
              <p>Kết quả bốn kỹ năng tiếng Anh</p>
            </div>
          </div>
          {latestAssessment ? (
            <>
              <div className={styles.skillGrid}>
                {(
                  [
                    ["Listening", latestAssessment.scores.listening],
                    ["Speaking", latestAssessment.scores.speaking],
                    ["Reading", latestAssessment.scores.reading],
                    ["Writing", latestAssessment.scores.writing],
                  ] as const
                ).map(([label, score]) => (
                  <div className={styles.skill} key={label}>
                    <span>{label}</span>
                    <strong>
                      {formatScore(score)}
                      <small>/10</small>
                    </strong>
                  </div>
                ))}
              </div>
              <div className={styles.comment}>
                <strong>Nhận xét của giáo viên</strong>
                <p>
                  {latestAssessment.teacherComment ||
                    latestAssessment.strengths}
                </p>
                {latestAssessment.improvements ? (
                  <p>
                    <b>Cần cải thiện:</b> {latestAssessment.improvements}
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <p className={styles.empty}>
              Chưa có đánh giá năng lực. Kết quả sẽ hiển thị sau khi giáo viên
              tạo đánh giá.
            </p>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2>Thanh toán gần đây</h2>
              <p>Lịch sử các khoản đã ghi nhận</p>
            </div>
          </div>
          {latestPayments.length ? (
            <ul className={styles.paymentList}>
              {latestPayments.map((payment) => (
                <li key={payment.id}>
                  <span>
                    <strong>{payment.month}</strong>
                    <small>
                      {dateLabel(payment.paidAt)} ·{" "}
                      {payment.method === "transfer"
                        ? "Chuyển khoản"
                        : "Tiền mặt"}
                    </small>
                  </span>
                  <strong className={styles.paid}>
                    {formatVND(payment.amount)}
                  </strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>Chưa có giao dịch thanh toán.</p>
          )}
        </section>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2>Thông báo mới</h2>
            <p>Thông tin được gửi đến tài khoản học sinh</p>
          </div>
          <span className={styles.count}>
            {unreadNotifications.length} chưa đọc
          </span>
        </div>
        {notifications.length ? (
          <ul className={styles.notificationList}>
            {notifications.slice(0, 4).map((item) => (
              <li key={item.id}>
                <span
                  className={item.readAt ? styles.dotRead : styles.dotUnread}
                  aria-hidden="true"
                />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.message}</small>
                </span>
                <time>{dateLabel(item.createdAt)}</time>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>Chưa có thông báo mới.</p>
        )}
      </section>

      <p className={styles.disclaimer}>
        Thông tin được tổng hợp từ dữ liệu hiện có của trung tâm. Số liệu học
        tập và học phí có thể thay đổi khi giáo viên hoặc quản trị viên cập nhật
        dữ liệu.
      </p>
    </div>
  );
}

export default function ParentHomePage() {
  return (
    <Suspense
      fallback={
        <div className={styles.notice}>Đang tải thông tin học tập...</div>
      }
    >
      <ParentDashboard />
    </Suspense>
  );
}
