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

  return (
    <>
      <PageHeader
        title={student.fullName}
        subtitle={`Mã ${student.code} · Lớp ${student.className}`}
        actions={<Button href="/admin/students">Về danh sách</Button>}
      />

      <div className={styles.stats}>
        <StatCard label="Điểm trung bình" value={formatScore(student.averageScore)} hint="Tất cả bài đã chấm" />
        <StatCard label="Chuyên cần" value={`${student.attendanceRate}%`} hint="Tính từ đầu khóa" />
        <StatCard
          label="Học phí tháng này"
          value={unpaid ? "Chưa đóng" : "Đã đóng"}
          hint={unpaid ? "Cần nhắc phụ huynh" : "Không có công nợ"}
          tone={unpaid ? "warning" : "default"}
        />
      </div>

      <Card title="Thông tin học sinh">
        <dl className={styles.info}>
          <div>
            <dt>Trạng thái</dt>
            <dd>
              <Badge tone={student.status === "active" ? "teal" : "amber"}>
                {student.status === "active" ? "Đang học" : "Nghỉ học"}
              </Badge>
            </dd>
          </div>
          <div>
            <dt>Ngày sinh</dt>
            <dd>{formatDate(student.dateOfBirth)}</dd>
          </div>
          <div>
            <dt>Ngày nhập học</dt>
            <dd>{formatDate(student.enrolledDate)}</dd>
          </div>
          <div>
            <dt>Phụ huynh</dt>
            <dd>{student.parentName}</dd>
          </div>
          <div>
            <dt>Số điện thoại</dt>
            <dd>{formatPhone(student.parentPhone)}</dd>
          </div>
          <div>
            <dt>Tên đăng nhập</dt>
            <dd>{student.code}</dd>
          </div>
        </dl>
      </Card>
    </>
  );
}

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Đang tải hồ sơ học sinh...</p>}>
      <StudentProfile params={params} />
    </Suspense>
  );
}
