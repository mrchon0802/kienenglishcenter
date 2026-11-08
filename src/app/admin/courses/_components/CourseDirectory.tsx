"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Course } from "@/types/course";
import { formatVND } from "@/lib/format";
import { deleteCourseAction } from "../actions";
import styles from "../page.module.css";

export function CourseDirectory({ courses, usage }: {
  courses: Course[];
  usage: Record<string, { classCount: number; studentCount: number }>;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const visible = useMemo(() => courses.filter((course) => {
    const keyword = query.trim().toLowerCase();
    const matchesQuery = !keyword || course.name.toLowerCase().includes(keyword) || course.code.toLowerCase().includes(keyword);
    return matchesQuery && (status === "all" || course.status === status);
  }), [courses, query, status]);

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageCourses = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function remove(course: Course) {
    if (!window.confirm(`Bạn có chắc muốn xóa khóa học "${course.name}"?`)) return;
    setError("");
    startTransition(async () => {
      const result = await deleteCourseAction(course.id);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <>
      {error && <p role="alert" className={styles.empty}>{error}</p>}
      <div className={styles.toolbar}>
        <input className={styles.search} value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Tìm theo tên hoặc mã khóa học..." aria-label="Tìm khóa học" />
        <div className={styles.filters} aria-label="Lọc trạng thái">
          {[["all", "Tất cả"], ["active", "Đang hoạt động"], ["inactive", "Ngừng hoạt động"]].map(([value, label]) => (
            <button key={value} type="button" className={`${styles.filter} ${status === value ? styles.activeFilter : ""}`} onClick={() => { setStatus(value); setPage(1); }}>{label}</button>
          ))}
        </div>
      </div>
      {visible.length ? <div className={styles.grid}>
        {pageCourses.map((course) => (
          <article className={styles.course} key={course.id}>
            <div className={styles.courseTop}>
              <span className={styles.code}>{course.code}</span>
              <span className={`${styles.status} ${course.status === "inactive" ? styles.inactive : ""}`}>{course.status === "active" ? "Đang hoạt động" : "Ngừng hoạt động"}</span>
            </div>
            <div>
              <h2>{course.name}</h2>
              <p className={styles.description}>{course.description || "Chưa có mô tả khóa học."}</p>
            </div>
            <div className={styles.meta}>
              <div><span>Cấp độ</span><strong>{course.level}</strong></div>
              <div><span>Thời lượng</span><strong>{course.durationWeeks} tuần · {course.totalSessions} buổi</strong></div>
              <div><span>Học phí chuẩn</span><strong>{formatVND(course.standardFee)}</strong></div>
              <div><span>Chương trình</span><strong>{course.units.length} Unit</strong></div>
            </div>
            <div className={styles.cardFooter}>
              <span className={styles.usage}>{usage[course.id]?.classCount ?? 0} lớp · {usage[course.id]?.studentCount ?? 0} học viên</span>
              <Link className={styles.link} href={`/admin/courses/${course.id}`}>Chi tiết →</Link>
            </div>
            <div className={styles.cardFooter}>
              <Link className={styles.link} href={`/admin/courses/${course.id}/edit`}>Chỉnh sửa</Link>
              <button type="button" className={styles.link} disabled={pending} onClick={() => remove(course)}>Xóa</button>
            </div>
          </article>
        ))}
      </div> : <div className={styles.empty}>Không tìm thấy khóa học phù hợp.</div>}
      {visible.length > 0 && <nav className={styles.pagination} aria-label="Phân trang khóa học">
        <span>Hiển thị {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, visible.length)} / {visible.length} khóa học</span>
        <div className={styles.pageControls}>
          <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Trước</button>
          <strong>{currentPage} / {pageCount}</strong>
          <button type="button" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Sau</button>
        </div>
      </nav>}
    </>
  );
}
