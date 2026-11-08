"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Curriculum } from "@/types/curriculum";
import { deleteCurriculumAction, initializeGradeCurriculaAction } from "../actions";
import styles from "../page.module.css";

export function CurriculumDirectory({ curricula, targetLabels }: {
  curricula: Curriculum[];
  targetLabels: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const visible = useMemo(() => curricula.filter((item) => {
    const q = query.trim().toLowerCase();
    const matchText = !q || item.title.toLowerCase().includes(q) || item.code.toLowerCase().includes(q);
    return matchText && (target === "all" || item.targetType === target);
  }), [curricula, query, target]);

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageCurricula = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function initializeGrades() {
    setError("");
    setNotice("");
    startTransition(async () => {
      const result = await initializeGradeCurriculaAction();
      if (!result.ok) setError(result.error);
      else {
        setNotice(result.created > 0
          ? `Đã khởi tạo ${result.created} chương trình còn thiếu. Các giáo trình đã có được giữ nguyên.`
          : "Chương trình lớp 1–9 đã được khởi tạo đầy đủ.");
        router.refresh();
      }
    });
  }

  function remove(item: Curriculum) {
    if (!window.confirm(`Xóa giáo trình "${item.title}"?`)) return;
    setError("");
    startTransition(async () => {
      const result = await deleteCurriculumAction(item.id);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return <>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {notice && <p role="status" className={styles.notice}>{notice}</p>}
    <div className={styles.toolbar}>
      <button type="button" className={styles.initializeButton} onClick={initializeGrades} disabled={pending}> {pending ? "Đang xử lý..." : "Khởi tạo chương trình lớp 1–9"} </button>
      <input className={styles.search} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Tìm theo tên hoặc mã giáo trình..." aria-label="Tìm giáo trình" />
      <div className={styles.filters} aria-label="Lọc loại giáo trình">
        {[["all", "Tất cả"], ["grade", "Theo lớp"], ["course", "Theo khóa học"]].map(([value, label]) => <button key={value} type="button" className={`${styles.filter} ${target === value ? styles.activeFilter : ""}`} onClick={() => { setTarget(value); setPage(1); }}>{label}</button>)}
      </div>
    </div>
    {visible.length ? <div className={styles.grid}>
      {pageCurricula.map((item) => {
        const lessonCount = item.units.reduce((sum, unit) => sum + unit.lessons.length, 0);
        return <article className={styles.card} key={item.id}>
          <div className={styles.cardTop}><span className={styles.code}>{item.code} · v{item.version ?? 1}</span><span className={`${styles.pill} ${item.status === "inactive" ? styles.inactive : ""}`}>{item.status === "active" ? "Đang sử dụng" : "Ngừng sử dụng"}</span></div>
          <div><h2>{item.title}</h2><p className={styles.description}>{item.description || "Chưa có mô tả."}</p></div>
          <div className={styles.meta}><span>{targetLabels[item.id] ?? "Chưa xác định đối tượng"}</span><span>·</span><span>{item.units.length} Unit</span><span>·</span><span>{lessonCount} Lesson</span></div>
          <div className={styles.cardFooter}><div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}><Link className={styles.link} href={`/admin/curriculum/${item.id}`}>Thống kê học liệu →</Link><Link className={styles.link} href={item.status === "active" ? `/admin/curriculum/${item.id}/edit` : `/admin/curriculum/${item.id}`}>{item.status === "active" ? "Tạo phiên bản mới" : "Xem phiên bản"}</Link></div><button type="button" className={styles.link} disabled={pending} onClick={() => remove(item)}>Xóa</button></div>
        </article>;
      })}
    </div> : <div className={styles.empty}>Chưa có giáo trình phù hợp. Hãy tạo giáo trình đầu tiên.</div>}
    {visible.length > 0 && <nav className={styles.pagination} aria-label="Phân trang giáo trình">
      <span>Hiển thị {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, visible.length)} / {visible.length} giáo trình</span>
      <div className={styles.pageControls}>
        <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Trước</button>
        <strong>{currentPage} / {pageCount}</strong>
        <button type="button" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Sau</button>
      </div>
    </nav>}
  </>;
}
