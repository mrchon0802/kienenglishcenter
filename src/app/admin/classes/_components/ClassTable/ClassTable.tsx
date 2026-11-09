import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { formatVND } from "@/lib/format";
import { formatScheduleSlots } from "@/lib/schedule";
import type { ClassWithCount } from "@/types/class";
import type { TeacherAssignmentRow } from "@/types/teacher-assignment";
import styles from "./ClassTable.module.css";

export function ClassTable({
  classes,
  teacherAssignments,
}: {
  classes: ClassWithCount[];
  teacherAssignments: TeacherAssignmentRow[];
}) {
  const teacherByClass = new Map(teacherAssignments.map((item) => [item.classId, item]));
  return (
    <div className={styles.root}>
      <div className={styles.desktopTable}>
        <Table>
          <thead><tr>
            <th scope="col">Lớp</th><th scope="col">Giáo viên phụ trách</th><th scope="col">Lịch học</th><th scope="col">Sĩ số</th>
            <th scope="col">Học phí / tháng</th><th scope="col">Đang học</th>
            <th scope="col"><span className="sr-only">Thao tác</span></th>
          </tr></thead>
          <tbody>{classes.map((c) => (
            <tr key={c.id}>
              <td><Link href={`/admin/classes/${c.id}`}>Lớp {c.name}</Link></td>
              <td>
                {teacherByClass.get(c.id)?.teacherName ? (
                  <span className={styles.teacherCell}>
                    <strong>{teacherByClass.get(c.id)?.teacherName}</strong>
                    <small>{teacherByClass.get(c.id)?.teacherCode}</small>
                  </span>
                ) : (
                  <Link href="/admin/teachers/assignments" className={styles.unassigned}>Chưa phân công · Phân công ngay</Link>
                )}
              </td>
              <td>{formatScheduleSlots(c.scheduleSlots, c.scheduleDays, c.startTime, c.endTime)}</td>
              <td>{c.studentCount} học sinh</td><td>{formatVND(c.monthlyFee)}</td><td>Unit {c.currentUnit}</td>
              <td><span className={styles.actions}><Button href={`/admin/classes/${c.id}`}>Xem lớp</Button><Button href={`/admin/classes/${c.id}/edit`}>Sửa</Button></span></td>
            </tr>
          ))}</tbody>
        </Table>
      </div>
      <div className={styles.mobileList}>
        {classes.map((c) => (
          <article className={styles.classCard} key={c.id}>
            <div className={styles.cardHead}><strong>Lớp {c.name}</strong><span>{c.studentCount} học sinh</span></div>
            <dl className={styles.details}>
              <div>
                <dt>Giáo viên phụ trách</dt>
                <dd>
                  {teacherByClass.get(c.id)?.teacherName ? (
                    <span className={styles.teacherCell}>
                      <strong>{teacherByClass.get(c.id)?.teacherName}</strong>
                      <small>{teacherByClass.get(c.id)?.teacherCode}</small>
                    </span>
                  ) : (
                    <Link href="/admin/teachers/assignments" className={styles.unassigned}>Chưa phân công · Phân công ngay</Link>
                  )}
                </dd>
              </div>
              <div><dt>Lịch học</dt><dd>{formatScheduleSlots(c.scheduleSlots, c.scheduleDays, c.startTime, c.endTime)}</dd></div>
              <div><dt>Học phí / tháng</dt><dd>{formatVND(c.monthlyFee)}</dd></div>
              <div><dt>Tiến độ</dt><dd>Unit {c.currentUnit}</dd></div>
            </dl>
            <div className={styles.cardActions}><Button href={`/admin/classes/${c.id}`}>Xem lớp</Button><Button href={`/admin/classes/${c.id}/edit`}>Sửa lớp</Button></div>
          </article>
        ))}
      </div>
    </div>
  );
}
