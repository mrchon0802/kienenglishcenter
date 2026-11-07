import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentStudentId } from "@/lib/current-user";
import { getStudentById } from "@/mocks/students";
import { getAssessmentsForStudent } from "@/mocks/student-assessments";
import { formatScore } from "@/lib/format";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Đánh giá năng lực | Kien English Center" };

function dateLabel(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}
const kindLabel = { progress: "Đánh giá thường xuyên", periodic: "Đánh giá định kỳ", final: "Đánh giá cuối khóa" } as const;

async function AssessmentContent() {
  await connection();
  const currentStudentId = await getCurrentStudentId();
  const student = await getStudentById(currentStudentId);
  if (!student) return <section className={styles.notice}><h1>Không tìm thấy hồ sơ học sinh</h1><p>Vui lòng liên hệ trung tâm.</p></section>;
  if (!student.parentAccessEnabled) return <section className={styles.notice}><h1>Quyền truy cập chưa được kích hoạt</h1><p>Trung tâm chưa bật Parent Portal cho {student.fullName}.</p></section>;

  const assessments = await getAssessmentsForStudent(student.id);
  const latest = assessments[0];
  const average = latest ? Object.values(latest.scores).reduce((sum, score) => sum + score, 0) / 4 : null;

  return <div className={styles.page}>
    <header className={styles.heading}><div><span className={styles.eyebrow}>PARENT PORTAL</span><h1>Kết quả đánh giá</h1><p>Theo dõi năng lực tiếng Anh và nhận xét của giáo viên qua từng lần đánh giá.</p></div><div className={styles.student}><strong>{student.fullName}</strong><span>Lớp {student.className} · {student.code}</span></div></header>
    <section className={styles.stats}>
      <article className={styles.stat}><span>Số lần đánh giá</span><strong>{assessments.length}</strong><small>Tất cả lần đánh giá đã lưu</small></article>
      <article className={styles.stat}><span>Điểm trung bình gần nhất</span><strong>{average === null ? "—" : formatScore(average)}</strong><small>Trung bình 4 kỹ năng / 10</small></article>
      <article className={styles.stat}><span>Ngày đánh giá gần nhất</span><strong>{latest ? dateLabel(latest.assessedAt) : "—"}</strong><small>{latest ? kindLabel[latest.kind] : "Chưa có dữ liệu"}</small></article>
      <article className={styles.stat}><span>Giáo viên</span><strong>{latest?.teacherId ?? "—"}</strong><small>Người thực hiện gần nhất</small></article>
    </section>
    {assessments.length ? assessments.map((item) => {
      const avg = Object.values(item.scores).reduce((sum, score) => sum + score, 0) / 4;
      return <section className={styles.panel} key={item.id}>
        <div className={styles.panelHead}><div><h2>{kindLabel[item.kind]}</h2><p>{dateLabel(item.assessedAt)} · {item.className}{item.curriculumLessonTitle ? ` · ${item.curriculumLessonTitle}` : ""}</p></div><span className={styles.pill}>TB {formatScore(avg)}/10</span></div>
        <div className={styles.skillGrid}>
          {([["Listening",item.scores.listening],["Speaking",item.scores.speaking],["Reading",item.scores.reading],["Writing",item.scores.writing]] as const).map(([label,score]) => <div className={styles.skill} key={label}><span>{label}</span><strong>{formatScore(score)}<small>/10</small></strong></div>)}
        </div>
        <div className={styles.comment}><strong>Điểm mạnh</strong><p>{item.strengths || "Chưa có nhận xét."}</p><strong>Nội dung cần cải thiện</strong><p>{item.improvements || "Chưa có nhận xét."}</p>{item.teacherComment ? <><strong>Nhận xét giáo viên</strong><p>{item.teacherComment}</p></> : null}</div>
      </section>;
    }) : <p className={styles.empty}>Chưa có đánh giá năng lực. Kết quả sẽ hiển thị sau khi giáo viên tạo đánh giá.</p>}
    <p className={styles.disclaimer}>Kết quả chỉ phản ánh các lần đánh giá đã được giáo viên lưu trong hệ thống.</p>
  </div>;
}

export default function ParentAssessmentsPage() {
  return <Suspense fallback={<div className={styles.loading}>Đang tải kết quả đánh giá...</div>}><AssessmentContent /></Suspense>;
}
