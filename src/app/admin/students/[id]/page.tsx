import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDate, formatPhone } from "@/lib/format-date";
import { formatScore } from "@/lib/format";
import { getStudentById } from "@/mocks/students";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Hồ sơ học sinh | Quản trị" };

async function StudentProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudentById(id);
  if (!student) notFound();

  const unpaid = student.tuitionStatus === "unpaid";
  const active = student.status === "active";

  return (
    <div className={styles.profile}>
      <PageHeader
        title={student.fullName}
        subtitle={`Mã học sinh ${student.code} · Lớp ${student.className}`}
        actions={
          <>
            <Button href={`/admin/students/${student.id}/edit`} variant="primary">Sửa thông tin</Button>
            <Button href={`/admin/reports/students/${student.id}`}>Báo cáo học sinh</Button>
            <Button href="/admin/students">Về danh sách</Button>
          </>
        }
      />

      <section className={styles.overview} aria-label="Tổng quan học tập">
        <div className={styles.sectionHeading}>
          <div>
            <h2>Tổng quan</h2>
            <p>Các chỉ số học tập và học phí hiện tại</p>
          </div>
          <Badge tone={active ? "teal" : "amber"}>{active ? "Đang học" : "Nghỉ học"}</Badge>
        </div>
        <div className={styles.stats}>
          <StatCard
            label="Điểm trung bình"
            value={student.averageScore > 0 ? formatScore(student.averageScore) : "Chưa có"}
            hint="Các bài đã được chấm"
          />
          <StatCard
            label="Chuyên cần"
            value={`${student.attendanceRate}%`}
            hint="Tính từ đầu khóa"
          />
          <StatCard
            label="Học phí tháng này"
            value={unpaid ? "Chưa đóng" : "Đã đóng"}
            hint={unpaid ? "Cần nhắc phụ huynh" : "Không có công nợ"}
            tone={unpaid ? "warning" : "default"}
          />
        </div>
      </section>

      <div className={styles.details}>
        <Card title="Thông tin học sinh">
          <dl className={styles.info}>
            <div className={styles.infoItem}>
              <dt>Trạng thái học tập</dt>
              <dd><Badge tone={active ? "teal" : "amber"}>{active ? "Đang học" : "Nghỉ học"}</Badge></dd>
            </div>
            <div className={styles.infoItem}>
              <dt>Lớp hiện tại</dt>
              <dd>{student.className}</dd>
            </div>
            <div className={styles.infoItem}>
              <dt>Ngày sinh</dt>
              <dd>{formatDate(student.dateOfBirth)}</dd>
            </div>
            <div className={styles.infoItem}>
              <dt>Ngày nhập học</dt>
              <dd>{formatDate(student.enrolledDate)}</dd>
            </div>
            <div className={styles.infoItem}>
              <dt>Mã học sinh</dt>
              <dd>{student.code}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Thông tin phụ huynh">
          <dl className={styles.info}>
            <div className={styles.infoItem}>
              <dt>Họ và tên phụ huynh</dt>
              <dd>{student.parentName || "—"}</dd>
            </div>
            <div className={styles.infoItem}>
              <dt>Số điện thoại liên hệ</dt>
              <dd>{student.parentPhone ? <a className={styles.phone} href={`tel:${student.parentPhone}`}>{formatPhone(student.parentPhone)}</a> : "—"}</dd>
            </div>
          </dl>
          <p className={styles.helper}>Thông tin dùng để liên hệ với phụ huynh khi cần trao đổi về việc học.</p>
        </Card>
      </div>
    </div>
  );
}

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Đang tải hồ sơ học sinh...</p>}>
      <StudentProfile params={params} />
    </Suspense>
  );
}
