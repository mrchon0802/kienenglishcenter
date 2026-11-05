import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { getStudentAssessments } from "@/mocks/student-assessments";
import styles from "./page.module.css";

export const metadata = { title: "Đánh giá năng lực | Quản trị" };

async function AssessmentReport() {
  await connection();
  const items = await getStudentAssessments();
  const averages = items.map((item) => Object.values(item.scores).reduce((sum, score) => sum + score, 0) / 4);
  const overall = averages.length ? (averages.reduce((sum, score) => sum + score, 0) / averages.length).toFixed(1) : "—";
  const students = new Set(items.map((item) => item.studentId));
  const classes = new Set(items.map((item) => item.classId));
  return <div className={styles.page}>
    <section className={styles.summary}>
      <article className={styles.kpi}><span>Lượt đánh giá</span><strong>{items.length}</strong></article>
      <article className={styles.kpi}><span>Học sinh đã đánh giá</span><strong>{students.size}</strong></article>
      <article className={styles.kpi}><span>Điểm trung bình 4 kỹ năng</span><strong>{overall}</strong></article>
    </section>
    <section className={styles.panel}>
      <h2>Lịch sử đánh giá toàn trung tâm</h2>
      {items.length ? <div className={styles.tableWrap}><table className={styles.table}>
        <thead><tr><th>Học sinh</th><th>Lớp</th><th>Ngày / Loại</th><th>4 kỹ năng</th><th>Điểm TB</th><th>Giáo viên</th><th>Nhận xét</th></tr></thead>
        <tbody>{items.map((item) => {
          const avg = (Object.values(item.scores).reduce((sum, score) => sum + score, 0) / 4).toFixed(1);
          const kind = item.kind === "progress" ? "Thường xuyên" : item.kind === "periodic" ? "Định kỳ" : "Cuối khóa";
          return <tr key={item.id}>
            <td><strong>{item.studentName}</strong><div className={styles.note}>{item.studentCode}</div></td>
            <td>{item.className}</td>
            <td>{item.assessedAt}<div className={styles.note}>{kind}</div></td>
            <td className={styles.skills}>Nghe {item.scores.listening} · Nói {item.scores.speaking}<br/>Đọc {item.scores.reading} · Viết {item.scores.writing}</td>
            <td className={styles.score}>{avg}/10</td>
            <td>{item.teacherId}</td>
            <td className={styles.note}>{item.strengths}<br/><strong>Cần cải thiện:</strong> {item.improvements}</td>
          </tr>;
        })}</tbody>
      </table></div> : <p className={styles.empty}>Chưa có dữ liệu đánh giá. Giáo viên có thể tạo đánh giá trong khu vực Teacher.</p>}
    </section>
  </div>;
}

export default function AdminAssessmentsPage() {
  return <><PageHeader title="Đánh giá năng lực học sinh" subtitle="Theo dõi Listening, Speaking, Reading, Writing và nhận xét của giáo viên."/><Suspense fallback={<p>Đang tổng hợp đánh giá...</p>}><AssessmentReport /></Suspense></>;
}
