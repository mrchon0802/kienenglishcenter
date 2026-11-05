"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import type { CourseEnrollmentRow, CourseEnrollmentStatus } from "@/types/course-enrollment";
import { createCourseEnrollmentAction, updateCourseEnrollmentStatusAction } from "../actions";
import styles from "./EnrollmentWorkspace.module.css";

type StudentOption = { id: string; code: string; fullName: string };
type CourseOption = { id: string; name: string; standardFee: number };
type ClassOption = { id: string; name: string; courseId: string; monthlyFee: number };

const STATUS_LABEL: Record<CourseEnrollmentStatus, string> = {
  active: "Đang học", completed: "Hoàn thành", paused: "Tạm dừng", cancelled: "Đã hủy",
};
const STATUS_CLASS: Record<CourseEnrollmentStatus, string> = {
  active: styles.active, completed: styles.completed, paused: styles.paused, cancelled: styles.cancelled,
};
const money = (value: number) => `${new Intl.NumberFormat("vi-VN").format(value)} đ`;

export function EnrollmentWorkspace({
  students, courses, classes, enrollments,
}: {
  students: StudentOption[];
  courses: CourseOption[];
  classes: ClassOption[];
  enrollments: CourseEnrollmentRow[];
}) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [studentId, setStudentId] = useState("");
  const [classId, setClassId] = useState("");
  const [enrolledAt, setEnrolledAt] = useState(new Date().toISOString().slice(0, 10));
  const [fee, setFee] = useState(String(courses[0]?.standardFee ?? 0));
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const eligibleClasses = useMemo(() => classes.filter((item) => item.courseId === courseId), [classes, courseId]);
  const visibleEnrollments = enrollments.filter((item) => {
    const matchesStatus = filter === "all" || item.status === filter;
    const query = search.trim().toLocaleLowerCase("vi-VN");
    const matchesSearch = !query || `${item.studentName} ${item.studentCode} ${item.courseName} ${item.className}`.toLocaleLowerCase("vi-VN").includes(query);
    return matchesStatus && matchesSearch;
  });
  const activeCount = enrollments.filter((item) => item.status === "active").length;
  const activeFee = enrollments.filter((item) => item.status === "active").reduce((sum, item) => sum + item.fee, 0);

  function changeCourse(nextId: string) {
    setCourseId(nextId);
    setClassId("");
    const nextCourse = courses.find((item) => item.id === nextId);
    setFee(String(nextCourse?.standardFee ?? 0));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await createCourseEnrollmentAction({
        studentId, courseId, classId, enrolledAt, fee: Number(fee), note,
      });
      if (!result.ok) { setError(result.error); return; }
      setMessage("Đã đăng ký học sinh vào khóa học.");
      setStudentId("");
      setClassId("");
      setNote("");
      window.location.reload();
    });
  }

  function changeStatus(id: string, status: CourseEnrollmentStatus) {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await updateCourseEnrollmentStatusAction(id, status);
      if (!result.ok) { setError(result.error); return; }
      window.location.reload();
    });
  }

  return <div className={styles.workspace}>
    <section className={styles.stats} aria-label="Tổng quan đăng ký">
      <div className={styles.stat}><span>Tổng lượt đăng ký</span><strong>{enrollments.length}</strong></div>
      <div className={styles.stat}><span>Đang học</span><strong>{activeCount}</strong></div>
      <div className={styles.stat}><span>Học phí các đăng ký đang học</span><strong>{money(activeFee)}</strong></div>
    </section>

    <section className={styles.panel}>
      <div className={styles.panelHead}><div><h2>Đăng ký học sinh</h2><p>Chọn khóa học trước, sau đó chọn lớp đang được liên kết với khóa học đó.</p></div></div>
      {courses.length === 0 ? <p className={styles.empty}>Chưa có khóa học đang hoạt động. Hãy tạo khóa học trước.</p> : <form className={styles.form} onSubmit={submit}>
        <label>Khóa học<select required value={courseId} onChange={(event) => changeCourse(event.target.value)}><option value="">Chọn khóa học</option>{courses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Học sinh<select required value={studentId} onChange={(event) => setStudentId(event.target.value)}><option value="">Chọn học sinh</option>{students.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.fullName}</option>)}</select></label>
        <label>Lớp thuộc khóa học<select required value={classId} onChange={(event) => setClassId(event.target.value)} disabled={!courseId || eligibleClasses.length === 0}><option value="">Chọn lớp</option>{eligibleClasses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Ngày đăng ký<input type="date" required value={enrolledAt} onChange={(event) => setEnrolledAt(event.target.value)} /></label>
        <label>Học phí khóa học (VNĐ)<input type="number" min="0" max="100000000" step="1000" required value={fee} onChange={(event) => setFee(event.target.value)} /></label>
        <label className={styles.full}>Ghi chú (không bắt buộc)<input value={note} onChange={(event) => setNote(event.target.value)} maxLength={300} placeholder="Ví dụ: Học buổi tối, mục tiêu thi Flyers..." /></label>
        {courseId && eligibleClasses.length === 0 && <p className={`${styles.notice} ${styles.full}`}>Khóa học này chưa có lớp nào được liên kết. Vào Quản lý lớp học, tạo hoặc chỉnh sửa lớp và chọn khóa học tương ứng trước khi đăng ký.</p>}
        {error && <p className={`${styles.feedback} ${styles.error}`} role="alert">{error}</p>}
        {message && <p className={`${styles.feedback} ${styles.success}`} role="status">{message}</p>}
        <div className={styles.formActions}><button type="submit" disabled={pending || !eligibleClasses.length}>{pending ? "Đang lưu..." : "+ Đăng ký học sinh"}</button></div>
      </form>}
    </section>

    <section className={styles.panel}>
      <div className={styles.panelHead}><div><h2>Danh sách đăng ký</h2><p>Mỗi đăng ký được quản lý riêng, không thay đổi lớp chính của học sinh.</p></div></div>
      <div className={styles.filters}>
        <input aria-label="Tìm học sinh hoặc khóa học" placeholder="Tìm tên, mã học sinh, khóa học..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <select aria-label="Lọc trạng thái" value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">Tất cả trạng thái</option><option value="active">Đang học</option><option value="completed">Hoàn thành</option><option value="paused">Tạm dừng</option><option value="cancelled">Đã hủy</option>
        </select>
      </div>
      {visibleEnrollments.length === 0 ? <div className={styles.empty}>Chưa có đăng ký phù hợp. Hãy thêm học sinh vào khóa học ở biểu mẫu phía trên.</div> : <div className={styles.tableWrap}><table>
        <thead><tr><th>Học sinh</th><th>Khóa học / Lớp</th><th>Ngày đăng ký</th><th>Học phí</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody>{visibleEnrollments.map((item) => <tr key={item.id}>
          <td><strong>{item.studentName}</strong><small>{item.studentCode}</small></td>
          <td><strong>{item.courseName}</strong><small>Lớp {item.className}</small></td>
          <td>{new Intl.DateTimeFormat("vi-VN").format(new Date(`${item.enrolledAt}T00:00:00`))}</td>
          <td>{money(item.fee)}</td>
          <td><span className={`${styles.status} ${STATUS_CLASS[item.status]}`}>{STATUS_LABEL[item.status]}</span></td>
          <td><div className={styles.rowActions}>
            {item.status === "active" && <><button type="button" onClick={() => changeStatus(item.id, "paused")} disabled={pending}>Tạm dừng</button><button type="button" onClick={() => changeStatus(item.id, "completed")} disabled={pending}>Hoàn thành</button><button type="button" className={styles.danger} onClick={() => changeStatus(item.id, "cancelled")} disabled={pending}>Hủy</button></>}
            {item.status === "paused" && <><button type="button" onClick={() => changeStatus(item.id, "active")} disabled={pending}>Học lại</button><button type="button" className={styles.danger} onClick={() => changeStatus(item.id, "cancelled")} disabled={pending}>Hủy</button></>}
            {(item.status === "completed" || item.status === "cancelled") && <span className={styles.muted}>Không có thao tác</span>}
          </div></td>
        </tr>)}</tbody>
      </table></div>}
    </section>
  </div>;
}
