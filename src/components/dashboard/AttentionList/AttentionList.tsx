import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { AttentionStudent } from "@/types/dashboard";
import styles from "./AttentionList.module.css";

export function AttentionList({ students }: { students: AttentionStudent[] }) {
  return (
    <Card title="Học sinh cần chú ý">
      {students.length === 0 ? (
        <p className={styles.empty}>Hiện chưa có học sinh nào cần chú ý.</p>
      ) : (
        <ul className={styles.list}>
          {students.map((student) => (
            <li key={student.id} className={styles.row}>
              <div>
                <p className={styles.name}>
                  {student.name} · {student.className}
                </p>
                <p className={styles.reason}>{student.reason}</p>
              </div>
              <Link href={student.href}>Xem hồ sơ</Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
