"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Curriculum } from "@/types/curriculum";
import { deleteCurriculumAction } from "../actions";
import styles from "../page.module.css";

export function CurriculumDirectory({ curricula, targetLabels }: {
  curricula: Curriculum[];
  targetLabels: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState("all");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const visible = useMemo(() => curricula.filter((item) => {
    const q = query.trim().toLowerCase();
    const matchText = !q || item.title.toLowerCase().includes(q) || item.code.toLowerCase().includes(q);
    return matchText && (target === "all" || item.targetType === target);
  }), [curricula, query, target]);

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
    <div className={styles.toolbar}>
      <input className={styles.search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên hoặc mã giáo trình..." aria-label="Tìm giáo trình" />
      <div className={styles.filters} aria-label="Lọc loại giáo trình">
        {[["all", "Tất cả"], ["grade", "Theo khối lớp"], ["course", "Theo khóa học"]].map(([value, label]) => <button key={value} type="button" className={`${styles.filter} ${target === value ? styles.activeFilter : ""}`} onClick={() => setTarget(value)}>{label}</button>)}
      </div>
    </div>
    {visible.length ? <div className={styles.grid}>
      {visible.map((item) => {
        const lessonCount = item.units.reduce((sum, unit) => sum + unit.lessons.length, 0);
        return <article className={styles.card} key={item.id}>
          <div className={styles.cardTop}><span className={styles.code}>{item.code}</span><span className={`${styles.pill} ${item.status === "inactive" ? styles.inactive : ""}`}>{item.status === "active" ? "Đang sử dụng" : "Ngừng sử dụng"}</span></div>
          <div><h2>{item.title}</h2><p className={styles.description}>{item.description || "Chưa có mô tả."}</p></div>
          <div className={styles.meta}><span>{targetLabels[item.id] ?? "Chưa xác định đối tượng"}</span><span>·</span><span>{item.units.length} Unit</span><span>·</span><span>{lessonCount} Lesson</span></div>
          <div className={styles.cardFooter}><Link className={styles.link} href={`/admin/curriculum/${item.id}/edit`}>Xem / chỉnh sửa →</Link><button type="button" className={styles.link} disabled={pending} onClick={() => remove(item)}>Xóa</button></div>
        </article>;
      })}
    </div> : <div className={styles.empty}>Chưa có giáo trình phù hợp. Hãy tạo giáo trình đầu tiên.</div>}
  </>;
}
