"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { normalizeText } from "@/lib/text";
import { formatDate, formatPhone } from "@/lib/format-date";
import type { ClassOption, Student } from "@/types/student";
import { StudentTable } from "../StudentTable";
import styles from "./StudentsView.module.css";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "active", label: "Đang học" },
  { value: "inactive", label: "Nghỉ học" },
];

interface StudentsViewProps {
  students: Student[];
  classes: ClassOption[];
}

export function StudentsView({ students, classes }: StudentsViewProps) {
  const [search, setSearch] = useState("");
  const [className, setClassName] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const keyword = normalizeText(search);
    return students.filter((s) => {
      if (className && s.className !== className) return false;
      if (status && s.status !== status) return false;
      if (!keyword) return true;
      const haystack = normalizeText(`${s.fullName} ${s.code} ${s.parentName} ${s.parentPhone}`);
      return haystack.includes(keyword);
    });
  }, [students, search, className, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  function updateFilter(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(1);
    };
  }

  function resetFilters() {
    setSearch("");
    setClassName("");
    setStatus("");
    setPage(1);
  }

  const hasFilter = Boolean(search || className || status);

  return (
    <Card>
      <div className={styles.toolbar}>
        <Input
          label="Tìm học sinh"
          type="search"
          placeholder="Tên, mã học sinh hoặc số điện thoại"
          value={search}
          onChange={(e) => updateFilter(setSearch)(e.target.value)}
        />
        <Select
          label="Lớp"
          placeholder="Tất cả lớp"
          options={classes.map((c) => ({ value: c.name, label: `Lớp ${c.name}` }))}
          value={className}
          onChange={(e) => updateFilter(setClassName)(e.target.value)}
        />
        <Select
          label="Trạng thái"
          placeholder="Tất cả"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => updateFilter(setStatus)(e.target.value)}
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="Không tìm thấy học sinh nào"
          description="Thử đổi từ khóa hoặc bỏ bớt bộ lọc."
        >
          {hasFilter ? <Button onClick={resetFilters}>Xóa bộ lọc</Button> : null}
        </EmptyState>
      ) : (
        <>
          <div className={styles.desktopTable}>
            <StudentTable students={visible} />
          </div>

          <div className={styles.mobileList}>
            {visible.map((student) => (
              <article className={styles.studentCard} key={student.id}>
                <div className={styles.studentHeading}>
                  <div className={styles.studentIdentity}>
                    <Link className={styles.studentName} href={`/admin/students/${student.id}`}>
                      {student.fullName}
                    </Link>
                    <span className={styles.studentCode}>{student.code}</span>
                  </div>
                  <Badge tone={student.status === "active" ? "teal" : "amber"}>
                    {student.status === "active" ? "Đang học" : "Nghỉ học"}
                  </Badge>
                </div>

                <div className={styles.studentDetails}>
                  <div>
                    <span className={styles.detailLabel}>Lớp</span>
                    <strong>{student.className}</strong>
                  </div>
                  <div>
                    <span className={styles.detailLabel}>Ngày nhập học</span>
                    <strong>{formatDate(student.enrolledDate)}</strong>
                  </div>
                  <div>
                    <span className={styles.detailLabel}>Phụ huynh</span>
                    <strong>{student.parentName || "Chưa cập nhật"}</strong>
                  </div>
                  <div>
                    <span className={styles.detailLabel}>Số điện thoại</span>
                    <strong>{formatPhone(student.parentPhone) || "Chưa cập nhật"}</strong>
                  </div>
                </div>

                <Link className={styles.detailLink} href={`/admin/students/${student.id}`}>
                  Xem hồ sơ học sinh <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>

          <div className={styles.footer}>
            <p className={styles.count} role="status">
              Hiển thị {start + 1} - {start + visible.length} / {filtered.length} học sinh
            </p>
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}
    </Card>
  );
}
