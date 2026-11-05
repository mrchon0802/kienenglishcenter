import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CURRENT_STUDENT_ID } from "@/mocks/session";
import { getStudentLearningGoals } from "@/mocks/student-learning";
import { createLearningGoalAction, updateLearningGoalAction } from "./actions";
import styles from "./goals.module.css";

export const metadata: Metadata = { title: "Mục tiêu học tập | Học sinh" };

async function GoalsContent() {
  await connection();
  const items = await getStudentLearningGoals(CURRENT_STUDENT_ID);
  return (
    <>
      <Card title="Tạo mục tiêu mới">
        <form action={createLearningGoalAction} className={styles.form}>
          <label>Tên mục tiêu<input name="title" required maxLength={100} placeholder="Ví dụ: Học 20 từ vựng mới" /></label>
          <label>Hạn hoàn thành<input name="targetDate" type="date" required /></label>
          <label>Số lượng cần đạt<input name="target" type="number" min={1} max={10000} required defaultValue={20} /></label>
          <label>Đơn vị<input name="unit" required maxLength={20} placeholder="từ, bài, phút..." /></label>
          <button type="submit">Thêm mục tiêu</button>
        </form>
      </Card>
      <Card title="Mục tiêu của em">
        {items.length === 0 ? <EmptyState title="Chưa có mục tiêu học tập" description="Tạo mục tiêu đầu tiên để theo dõi tiến độ của mình." /> : <div className={styles.list}>{items.map((goal) => {
          const percent = Math.min(100, Math.round((goal.progress / goal.target) * 100));
          return <article className={styles.goal} key={goal.id}>
            <div className={styles.goalHead}><div><h2>{goal.title}</h2><p>Hạn: {new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(`${goal.targetDate}T00:00:00`))}</p></div><span className={goal.status === "completed" ? styles.done : styles.active}>{goal.status === "completed" ? "Hoàn thành" : "Đang thực hiện"}</span></div>
            <div className={styles.progressMeta}><strong>{goal.progress}/{goal.target} {goal.unit}</strong><span>{percent}%</span></div>
            <div className={styles.track} role="progressbar" aria-label={`Tiến độ ${goal.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }} /></div>
            {goal.status !== "completed" ? <form action={updateLearningGoalAction} className={styles.updateForm}><input type="hidden" name="goalId" value={goal.id} /><label>Cập nhật tiến độ<input name="progress" type="number" min={0} max={goal.target} defaultValue={goal.progress} required /></label><button type="submit">Lưu tiến độ</button><small>Nhập số lượng em đã hoàn thành.</small></form> : null}
          </article>;
        })}</div>}
      </Card>
      <p className={styles.note}>Đây là dữ liệu mô phỏng. Mục tiêu được lưu trong bộ nhớ server và có thể được đặt lại khi khởi động lại máy chủ.</p>
    </>
  );
}

export default function StudentGoalsPage() {
  return <><PageHeader title="Mục tiêu học tập" subtitle="Đặt mục tiêu nhỏ, theo dõi tiến độ và duy trì thói quen học tiếng Anh." /><Suspense fallback={<p>Đang tải mục tiêu...</p>}><GoalsContent /></Suspense></>;
}
