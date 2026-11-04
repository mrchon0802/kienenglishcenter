"use client";

import { useState, useTransition } from "react";
import { saveTeacherManualGrade } from "./actions";
import type { EssayGradingItem } from "@/types/assignment";
import styles from "../../assignments.module.css";

function GradeCard({ item }: { item: EssayGradingItem }) {
  const [score, setScore] = useState(item.grade ? String(item.grade.score) : "");
  const [comment, setComment] = useState(item.grade?.comment ?? "");
  const [saved, setSaved] = useState(item.grade !== null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    const numeric = Number(score);
    if (!score.trim() || !Number.isFinite(numeric) || numeric < 0 || numeric > item.points) {
      setError(`Nhập điểm từ 0 đến ${item.points}.`);
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await saveTeacherManualGrade({ attemptId: item.attemptId, questionId: item.questionId, score: numeric, comment });
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return <article className={styles.gradeCard}>
    <div className={styles.attemptHead}><div><strong>{item.studentName}</strong><p>Lần làm {item.attemptNo} · Nộp lúc {new Date(item.submittedAt).toLocaleString("vi-VN")}</p></div><span className={saved ? styles.statusDone : styles.statusPending}>{saved ? "Đã chấm" : "Chờ chấm"}</span></div>
    <h3>{item.prompt}</h3>
    <p className={styles.fieldLabel}>Bài làm của học sinh</p><blockquote className={styles.studentAnswer}>{item.answer}</blockquote>
    {item.sampleAnswer.trim() && <><p className={styles.fieldLabel}>Đáp án tham khảo</p><p className={styles.sampleAnswer}>{item.sampleAnswer}</p></>}
    <div className={styles.gradeForm}><label>Điểm (tối đa {item.points})<input type="number" min="0" max={item.points} step="0.5" value={score} onChange={(event) => { setScore(event.target.value); setSaved(false); }} /></label><label>Nhận xét cho học sinh<textarea rows={3} maxLength={500} value={comment} onChange={(event) => { setComment(event.target.value); setSaved(false); }} placeholder="Nhập nhận xét nếu cần..." /></label></div>
    <div className={styles.gradeActions}><button type="button" onClick={submit} disabled={pending}>{pending ? "Đang lưu..." : saved ? "Cập nhật điểm" : "Lưu điểm"}</button>{saved && <span role="status">Đã lưu điểm.</span>}{error && <span role="alert">{error}</span>}</div>
  </article>;
}

export function GradingQueue({ items }: { items: EssayGradingItem[] }) {
  const [showGraded, setShowGraded] = useState(false);
  const pendingCount = items.filter((item) => item.grade === null).length;
  const visible = showGraded ? items : items.filter((item) => item.grade === null);
  return <div className={styles.gradeQueue}>
    <div className={styles.queueToolbar}><strong>{pendingCount ? `Còn ${pendingCount} câu trả lời chờ chấm` : "Đã chấm tất cả câu trả lời tự luận"}</strong><label><input type="checkbox" checked={showGraded} onChange={(event) => setShowGraded(event.target.checked)} /> Hiện cả câu đã chấm</label></div>
    {visible.length ? visible.map((item) => <GradeCard key={`${item.attemptId}-${item.questionId}`} item={item} />) : <div className={styles.empty}>Không có câu trả lời tự luận cần chấm.</div>}
  </div>;
}
