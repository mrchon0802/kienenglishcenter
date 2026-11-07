"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "../../page.module.css";

interface Row {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  specialization: string;
  employment: string;
  status: string;
}

function statusLabel(status: string) {
  if (status === "active") return "Đang hoạt động";
  if (status === "locked") return "Đã khóa";
  return "Chờ kích hoạt";
}

export function TeacherList({ rows }: { rows: Row[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const q = query.trim().toLowerCase();
      const matches =
        !q ||
        [row.code, row.name, row.phone, row.email].some((value) =>
          value.toLowerCase().includes(q),
        );
      return matches && (status === "all" || row.status === status);
    });
  }, [rows, query, status]);

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <input
          aria-label="Tìm giáo viên"
          placeholder="Tìm theo mã, tên, số điện thoại hoặc email..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          aria-label="Lọc trạng thái tài khoản"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">Tất cả tài khoản</option>
          <option value="pending_activation">Chờ kích hoạt</option>
          <option value="active">Đang hoạt động</option>
          <option value="locked">Đã khóa</option>
        </select>
        <span className={styles.muted}>
          {filtered.length}/{rows.length} giáo viên
        </span>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã GV</th>
              <th>Họ và tên</th>
              <th>Liên hệ</th>
              <th>Chuyên môn</th>
              <th>Làm việc</th>
              <th>Tài khoản</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id}>
                <td>{row.code}</td>
                <td><strong>{row.name}</strong></td>
                <td>
                  {row.phone}
                  <br />
                  <span className={styles.muted}>{row.email}</span>
                </td>
                <td>{row.specialization || "—"}</td>
                <td>{row.employment === "working" ? "Đang làm việc" : "Ngừng làm việc"}</td>
                <td>
                  <span className={`${styles.status} ${row.status === "active" ? styles.active : row.status === "locked" ? styles.locked : ""}`}>
                    {statusLabel(row.status)}
                  </span>
                </td>
                <td><Link href={`/admin/teachers/${row.id}`}>Chi tiết</Link></td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={7} className={styles.empty}>Không tìm thấy giáo viên phù hợp.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.mobileList} aria-label="Danh sách giáo viên">
        {filtered.map((row) => (
          <article className={styles.teacherCard} key={row.id}>
            <div className={styles.teacherCardHead}>
              <div className={styles.teacherIdentity}>
                <strong>{row.name}</strong>
                <span>{row.code}</span>
              </div>
              <span className={`${styles.status} ${row.status === "active" ? styles.active : row.status === "locked" ? styles.locked : ""}`}>
                {statusLabel(row.status)}
              </span>
            </div>
            <dl className={styles.teacherDetails}>
              <div><dt>Số điện thoại</dt><dd>{row.phone || "—"}</dd></div>
              <div><dt>Email</dt><dd>{row.email || "—"}</dd></div>
              <div><dt>Chuyên môn</dt><dd>{row.specialization || "—"}</dd></div>
              <div><dt>Tình trạng làm việc</dt><dd>{row.employment === "working" ? "Đang làm việc" : "Ngừng làm việc"}</dd></div>
            </dl>
            <Link className={styles.detailLink} href={`/admin/teachers/${row.id}`}>Xem hồ sơ giáo viên</Link>
          </article>
        ))}
        {!filtered.length && <p className={styles.mobileEmpty}>Không tìm thấy giáo viên phù hợp.</p>}
      </div>
    </div>
  );
}
