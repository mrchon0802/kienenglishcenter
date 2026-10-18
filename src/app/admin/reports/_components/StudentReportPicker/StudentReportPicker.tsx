"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { normalizeText } from "@/lib/text";
import styles from "./StudentReportPicker.module.css";

interface StudentReportPickerProps {
  students: { id: string; name: string; className: string; code: string }[];
}

const MAX_RESULTS = 8;

export function StudentReportPicker({ students }: StudentReportPickerProps) {
  const [search, setSearch] = useState("");

  const results = useMemo(() => {
    const keyword = normalizeText(search);
    if (!keyword) return [];
    return students
      .filter((s) => normalizeText(`${s.name} ${s.code}`).includes(keyword))
      .slice(0, MAX_RESULTS);
  }, [students, search]);

  return (
    <div className={styles.wrap}>
      <Input
        label="Tìm học sinh"
        type="search"
        placeholder="Gõ tên hoặc mã học sinh"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {search.trim() ? (
        results.length === 0 ? (
          <p className={styles.hint} role="status">
            Không tìm thấy học sinh nào.
          </p>
        ) : (
          <ul className={styles.list} aria-label="Kết quả tìm kiếm">
            {results.map((s) => (
              <li key={s.id}>
                <Link href={`/admin/reports/students/${s.id}`} className={styles.item}>
                  <span>{s.name}</span>
                  <span className={styles.meta}>
                    {s.code} · Lớp {s.className}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : (
        <p className={styles.hint}>Gõ tên để mở báo cáo của từng học sinh.</p>
      )}
    </div>
  );
}
