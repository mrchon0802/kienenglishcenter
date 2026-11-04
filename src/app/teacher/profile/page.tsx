import { Suspense } from "react";
import { connection } from "next/server";
import { DEMO_CENTER_USER } from "@/mocks/teacher-session";
import { getTeacherPortalData } from "@/mocks/teacher-portal";
import styles from "../teacher.module.css";

export const metadata = { title: "Hồ sơ cá nhân | Giáo viên" };

async function TeacherProfile() {
  await connection();
  const data = await getTeacherPortalData(DEMO_CENTER_USER.teacherId);
  if (!data) return <p>Không tìm thấy hồ sơ giáo viên.</p>;
  const { teacher, account } = data;
  const fields = [
    ["Mã giáo viên", teacher.teacherCode], ["Họ và tên", teacher.fullName], ["Email", teacher.email], ["Số điện thoại", teacher.phoneNumber],
    ["Chuyên môn", teacher.specialization || "Chưa cập nhật"], ["Trình độ", teacher.qualification || "Chưa cập nhật"],
    ["Chứng chỉ", teacher.certificates.join(", ") || "Chưa cập nhật"], ["Ngày bắt đầu", teacher.startDate],
    ["Trạng thái làm việc", teacher.employmentStatus === "working" ? "Đang làm việc" : "Ngừng làm việc"],
    ["Trạng thái tài khoản", account?.status === "active" ? "Đang hoạt động" : account?.status === "locked" ? "Đã khóa" : "Chờ kích hoạt"],
  ];
  return <><section className={styles.heading}><div><p className={styles.eyebrow}>MY ACCOUNT</p><h1>Hồ sơ giáo viên</h1><p className={styles.muted}>Thông tin cá nhân và tài khoản đang sử dụng.</p></div><span className={styles.demo}>Chỉ xem</span></section><section className={styles.profileCard}><div className={styles.profileTop}><div className={styles.profileAvatar}>{teacher.fullName.split(" ").slice(-2).map((part) => part[0]).join("")}</div><div><h2>{teacher.fullName}</h2><p>{teacher.teacherCode} · Giáo viên</p></div></div><dl className={styles.details}>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{teacher.note ? <p className={styles.note}>Ghi chú: {teacher.note}</p> : null}</section></>;
}
export default function TeacherProfilePage() {
  return (
    <Suspense fallback={<p>Đang tải hồ sơ giáo viên...</p>}>
      <TeacherProfile />
    </Suspense>
  );
}
