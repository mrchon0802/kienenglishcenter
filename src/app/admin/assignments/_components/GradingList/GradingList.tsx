"use client";

import { useState, useTransition } from "react";
import { saveManualGradeAction } from "@/app/admin/assignments/grade-actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { formatDateTime } from "@/lib/format-datetime";
import type { EssayGradingItem } from "@/types/assignment";
import styles from "./GradingList.module.css";

function GradingCard({ item }: { item: EssayGradingItem }) {
  const [scoreText, setScoreText] = useState(item.grade ? String(item.grade.score) : "");
  const [comment, setComment] = useState(item.grade?.comment ?? "");
  const [saved, setSaved] = useState(item.grade !== null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    const score = Number(scoreText);
    if (scoreText.trim() === "" || !Number.isFinite(score) || score < 0 || score > item.points) {
      setError(`Nhập điểm từ 0 đến ${item.points}.`);
      return;
    }
    setError("");
    startTransition(async () => {
      const response = await saveManualGradeAction({
        attemptId: item.attemptId,
        questionId: item.questionId,
        score,
        comment,
      });
      if (response.ok) setSaved(true);
      else setError(response.error);
    });
  }

  return (
    <Card as="div">
      <div className={styles.head}>
        <p className={styles.student}>
          {item.studentName}{" "}
          <span className={styles.meta}>
            · lần làm {item.attemptNo} · nộp {formatDateTime(item.submittedAt)}
          </span>
        </p>
        {saved ? <Badge>Đã chấm</Badge> : <Badge tone="amber">Chờ chấm</Badge>}
      </div>

      <p className={styles.prompt}>{item.prompt}</p>

      <p className={styles.label}>Bài làm của học sinh</p>
      <blockquote className={styles.answer}>{item.answer}</blockquote>

      {item.sampleAnswer.trim() ? (
        <>
          <p className={styles.label}>Đáp án mẫu</p>
          <p className={styles.sample}>{item.sampleAnswer}</p>
        </>
      ) : null}

      <div className={styles.form}>
        <Input
          label={`Điểm (tối đa ${item.points})`}
          type="number"
          min={0}
          max={item.points}
          step={0.5}
          value={scoreText}
          onChange={(e) => {
            setScoreText(e.target.value);
            setSaved(false);
          }}
        />
        <Textarea
          label="Nhận xét cho học sinh (không bắt buộc)"
          rows={2}
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
            setSaved(false);
          }}
        />
      </div>

      <div className={styles.actions}>
        <Button variant="primary" onClick={save} disabled={pending}>
          {pending ? "Đang lưu..." : saved ? "Lưu lại" : "Lưu điểm"}
        </Button>
        {saved ? <span className={styles.ok} role="status">Đã lưu điểm.</span> : null}
        {error ? <span className={styles.error} role="alert">{error}</span> : null}
      </div>
    </Card>
  );
}

export function GradingList({ items }: { items: EssayGradingItem[] }) {
  const [showGraded, setShowGraded] = useState(false);
  const waiting = items.filter((i) => i.grade === null).length;
  const visible = showGraded ? items : items.filter((i) => i.grade === null);

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <p className={styles.count} role="status">
          {waiting > 0 ? `Còn ${waiting} bài chờ chấm` : "Đã chấm hết các bài tự luận"}
        </p>
        <label className={styles.toggle}>
          <input type="checkbox" checked={showGraded} onChange={(e) => setShowGraded(e.target.checked)} />
          Hiện cả bài đã chấm
        </label>
      </div>

      {visible.length === 0 ? (
        <Card>
          <p className={styles.empty}>Không có bài tự luận nào cần chấm.</p>
        </Card>
      ) : (
        visible.map((item) => <GradingCard key={`${item.attemptId}-${item.questionId}`} item={item} />)
      )}
    </div>
  );
}
