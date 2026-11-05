"use client";

import { useMemo, useState } from "react";
import styles from "./students.module.css";

type StudentRow = {
  id: string;
  name: string;
  className: string;
  code?: string;
};

type Note = {
  studentId: string;
  text: string;
  updatedAt: string;
};

export function StudentNotesWorkspace({
  students,
}: {
  students: StudentRow[];
}) {
  const [selected, setSelected] = useState(students[0]?.id ?? "");
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const classes = useMemo(
    () => [...new Set(students.map((s) => s.className))],
    [students],
  );

  const visible = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchClass = filter === "all" || student.className === filter;

      const matchSearch =
        !keyword ||
        student.name.toLowerCase().includes(keyword) ||
        student.id.toLowerCase().includes(keyword) ||
        (student.code ?? "").toLowerCase().includes(keyword);

      return matchClass && matchSearch;
    });
  }, [students, filter, search]);

  const active = students.find((s) => s.id === selected);
  const current = notes.find((n) => n.studentId === selected);

  function selectStudent(student: StudentRow) {
    setSelected(student.id);
    setDraft(notes.find((n) => n.studentId === student.id)?.text ?? "");
  }

  function save() {
    if (!selected || !draft.trim()) return;

    const next: Note = {
      studentId: selected,
      text: draft.trim(),
      updatedAt: new Date().toLocaleString("vi-VN"),
    };

    setNotes((old) => [...old.filter((n) => n.studentId !== selected), next]);
  }

  function getInitials(name: string) {
    const words = name.trim().split(/\s+/);
    return words.length > 1
      ? `${words[words.length - 2][0]}${words[words.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }

  return (
    <div className={styles.workspace}>
      <aside className={styles.roster}>
        <div className={styles.rosterHead}>
          <div>
            <h2>Danh sách học viên</h2>
            <p>{visible.length} học viên</p>
          </div>
          <span className={styles.totalBadge}>{students.length}</span>
        </div>

        <div className={styles.filters}>
          <label className={styles.label} htmlFor="class-filter">
            Lớp học
          </label>

          <select
            id="class-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={styles.control}
          >
            <option value="all">Tất cả lớp</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                Lớp {c}
              </option>
            ))}
          </select>

          <label className={styles.label} htmlFor="student-search">
            Tìm kiếm
          </label>

          <div className={styles.searchBox}>
            <span aria-hidden="true">⌕</span>
            <input
              id="student-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tên hoặc mã học viên..."
            />
          </div>
        </div>

        <div className={styles.studentList}>
          {visible.map((student) => {
            const isSelected = selected === student.id;
            const hasNote = notes.some((note) => note.studentId === student.id);

            return (
              <button
                key={student.id}
                type="button"
                className={`${styles.student} ${
                  isSelected ? styles.selected : ""
                }`}
                onClick={() => selectStudent(student)}
                aria-pressed={isSelected}
              >
                <span className={styles.avatar}>
                  {getInitials(student.name)}
                </span>

                <span className={styles.studentInfo}>
                  <strong>{student.name}</strong>
                  <span>
                    {student.code ?? student.id} · Lớp {student.className}
                  </span>
                </span>

                {hasNote && (
                  <span
                    className={styles.noteIndicator}
                    title="Đã có ghi chú"
                    aria-label="Đã có ghi chú"
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}

          {!visible.length && (
            <div className={styles.emptyRoster}>
              <span>⌕</span>
              <strong>Không tìm thấy học viên</strong>
              <p>Thử thay đổi từ khóa hoặc bộ lọc lớp.</p>
            </div>
          )}
        </div>
      </aside>

      <div className={styles.editor}>
        {active ? (
          <>
            <div className={styles.profileHead}>
              <span className={styles.profileAvatar}>
                {getInitials(active.name)}
              </span>

              <div>
                <p className={styles.eyebrow}>HỒ SƠ HỌC VIÊN</p>
                <h2>{active.name}</h2>
                <p className={styles.muted}>
                  {active.code ?? active.id} · Lớp {active.className}
                </p>
              </div>
            </div>

            <div className={styles.noteSection}>
              <div className={styles.noteTitle}>
                <label className={styles.label} htmlFor="student-note">
                  Ghi chú giảng dạy
                </label>
                {current && (
                  <span className={styles.noteStatus}>Đã có ghi chú</span>
                )}
              </div>

              <textarea
                id="student-note"
                className={styles.textarea}
                rows={7}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ví dụ: cần luyện thêm phát âm âm cuối, tích cực tham gia hoạt động nhóm..."
              />

              <div className={styles.editorFooter}>
                <p className={styles.hint}>
                  Ghi chú chỉ phục vụ theo dõi quá trình giảng dạy.
                </p>

                <button
                  type="button"
                  className={styles.primary}
                  onClick={save}
                  disabled={!draft.trim()}
                >
                  Lưu ghi chú
                </button>
              </div>

              {current && (
                <p className={styles.saved} role="status">
                  Đã lưu trong phiên hiện tại · {current.updatedAt}
                </p>
              )}

              <p className={styles.hint}>
                Dữ liệu đang dùng state phía trình duyệt; tải lại trang sẽ đặt
                lại dữ liệu mẫu.
              </p>
            </div>
          </>
        ) : (
          <div className={styles.editorEmpty}>
            <span>👨‍🎓</span>
            <h3>Chọn học viên</h3>
            <p>Chọn một học viên trong danh sách để xem và ghi chú.</p>
          </div>
        )}
      </div>
    </div>
  );
}
