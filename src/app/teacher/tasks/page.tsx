import { TeachingTasks } from "./TeachingTasks";
import styles from "../teacher.module.css";
export const metadata = { title: "Công việc giảng dạy | Giáo viên" };
export default function TeacherTasksPage() {
  return <section className={styles.panel}><div className={styles.panelHead}><div><h1>Công việc giảng dạy</h1><p className={styles.muted}>Theo dõi các đầu việc cá nhân trong quá trình giảng dạy.</p></div></div><TeachingTasks /></section>;
}
