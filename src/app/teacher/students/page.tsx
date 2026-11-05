import { Suspense } from "react";
import { connection } from "next/server";
import { DEMO_CENTER_USER } from "@/mocks/teacher-session";
import { getTeacherPortalData } from "@/mocks/teacher-portal";
import { StudentNotesWorkspace } from "./StudentNotesWorkspace";
import styles from "../teacher.module.css";

async function StudentsContent() {
  await connection();
  const data = await getTeacherPortalData(DEMO_CENTER_USER.teacherId);
  const students = data?.classes.flatMap((cls) => cls.students.map((student) => ({
    id: student.id, name: student.fullName, className: cls.name, code: student.code,
  }))) ?? [];
  return <section className={styles.panel}><div className={styles.panelHead}><div><h1>Ghi chú học viên</h1><p className={styles.muted}>Chỉ hiển thị học viên thuộc các lớp bạn được phân công.</p></div></div><StudentNotesWorkspace students={students} /></section>;
}
export default function TeacherStudentsPage() {
  return <Suspense fallback={<p>Đang tải danh sách học viên...</p>}><StudentsContent /></Suspense>;
}
