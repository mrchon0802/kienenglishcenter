import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { CURRENT_STUDENT_ID } from "@/mocks/session";
import { getStudentById } from "@/mocks/students";
import { getStudentAssignments } from "@/mocks/assignments";
import { formatScore } from "@/lib/format";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Bài tập và kết quả | Kien English Center" };

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}
const statusLabel = { todo: "Chưa hoàn thành", done: "Đã nộp", missed: "Quá hạn" } as const;

async function HomeworkContent() {
  await connection();
  const student = await getStudentById(CURRENT_STUDENT_ID);
  if (!student) return <section className={styles.notice}><h1>Không tìm thấy hồ sơ học sinh</h1><p>Vui lòng liên hệ trung tâm.</p></section>;
  if (!student.parentAccessEnabled) return <section className={styles.notice}><h1>Quyền truy cập chưa được kích hoạt</h1><p>Trung tâm chưa bật Parent Portal cho {student.fullName}.</p></section>;

  const assignments = await getStudentAssignments(student.id, new Date());
  const done = assignments.filter((item) => item.status === "done").length;
  const todo = assignments.filter((item) => item.status === "todo").length;
  const missed = assignments.filter((item) => item.status === "missed").length;
  const scored = assignments.filter((item) => item.bestScore !== null);
  const average = scored.length ? scored.reduce((sum,item) => sum + (item.bestScore ?? 0), 0) / scored.length : null;

  return <div className={styles.page}>
    <header className={styles.heading}><div><span className={styles.eyebrow}>PARENT PORTAL</span><h1>Bài tập và kết quả</h1><p>Theo dõi bài được giao, hạn nộp và kết quả đã được hệ thống ghi nhận.</p></div><div className={styles.student}><strong>{student.fullName}</strong><span>Lớp {student.className} · {student.code}</span></div></header>
    <section className={styles.stats}>
      <article className={styles.stat}><span>Tổng bài tập</span><strong>{assignments.length}</strong><small>Trong lớp hiện tại</small></article>
      <article className={styles.stat}><span>Đã nộp</span><strong>{done}</strong><small>Bài đã có lượt nộp</small></article>
      <article className={styles.stat}><span>Chưa hoàn thành</span><strong>{todo}</strong><small>Bài còn trong hạn</small></article>
      <article className={styles.stat}><span>Điểm trung bình</span><strong>{average === null ? "—" : formatScore(average)}</strong><small>{scored.length} bài đã có điểm</small></article>
    </section>
    <section className={styles.panel}>
      <div className={styles.panelHead}><div><h2>Danh sách bài tập</h2><p>{missed} bài quá hạn · Điểm chỉ hiển thị khi đã được chấm.</p></div></div>
      {assignments.length ? <ul className={styles.list}>{assignments.map((item) => <li key={item.id}><span className={styles.info}><strong>{item.title}</strong><small>{item.kind === "test" ? "Bài kiểm tra" : "Bài luyện tập"} · Hạn nộp {dateLabel(item.dueAt)} · {item.attemptsUsed} lượt nộp</small><small>{item.bestScore === null ? "Chưa có điểm được ghi nhận" : `Điểm cao nhất: ${formatScore(item.bestScore)}/10`}</small></span><span className={`${styles.pill} ${item.status === "missed" ? styles.danger : item.status === "todo" ? styles.warning : ""}`}>{statusLabel[item.status]}</span></li>)}</ul> : <p className={styles.empty}>Hiện chưa có bài tập được giao cho lớp.</p>}
    </section>
    <p className={styles.disclaimer}>Trang này chỉ hiển thị trạng thái và điểm tổng hợp từ hệ thống bài tập. Câu trả lời và thao tác làm bài vẫn thuộc Student Portal.</p>
  </div>;
}

export default function ParentHomeworkPage() {
  return <Suspense fallback={<div className={styles.loading}>Đang tải bài tập...</div>}><HomeworkContent /></Suspense>;
}
