"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { createTeacherAction, updateTeacherAction } from "../../actions";
import type { Teacher, TeacherInput } from "@/types/teacher";
import styles from "./TeacherForm.module.css";

const EMPTY: TeacherInput = { fullName:"", phoneNumber:"", email:"", dateOfBirth:"", gender:"", address:"", specialization:"", qualification:"", certificates:"", startDate:"", employmentStatus:"working", note:"" };
function fromTeacher(teacher: Teacher): TeacherInput {
  return { fullName:teacher.fullName, phoneNumber:teacher.phoneNumber, email:teacher.email, dateOfBirth:teacher.dateOfBirth ?? "", gender:teacher.gender ?? "", address:teacher.address ?? "", specialization:teacher.specialization ?? "", qualification:teacher.qualification ?? "", certificates:teacher.certificates.join(", "), startDate:teacher.startDate, employmentStatus:teacher.employmentStatus, note:teacher.note ?? "" };
}
export function TeacherForm({ teacher }: { teacher?: Teacher }) {
  const router = useRouter(); const [pending,startTransition] = useTransition();
  const [values,setValues] = useState<TeacherInput>(teacher ? fromTeacher(teacher) : EMPTY);
  const [error,setError] = useState(""); const [message,setMessage] = useState("");
  function field<K extends keyof TeacherInput>(key:K,value:TeacherInput[K]) { setValues((old)=>({...old,[key]:value})); setError(""); }
  function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    startTransition(async()=>{
      const result = teacher ? await updateTeacherAction(teacher.id,values) : await createTeacherAction(values);
      if (!result.ok) { setError(result.error); return; }
      if (teacher) { setMessage("Đã cập nhật hồ sơ giáo viên."); router.refresh(); }
      else { router.push(`/admin/teachers/${result.id}`); router.refresh(); }
    });
  }
  return <form className={styles.form} onSubmit={submit}>
    {error && <p className={styles.error} role="alert">{error}</p>}{message && <p className={styles.success} role="status">{message}</p>}
    <section className={styles.section}><h2>Thông tin cá nhân</h2><div className={styles.grid}>
      <label>Họ và tên *<input required value={values.fullName} onChange={e=>field("fullName",e.target.value)} /></label>
      <label>Số điện thoại *<input required inputMode="tel" value={values.phoneNumber} onChange={e=>field("phoneNumber",e.target.value)} placeholder="09xxxxxxxx" /></label>
      <label>Email *<input required type="email" value={values.email} onChange={e=>field("email",e.target.value)} /></label>
      <label>Ngày sinh<input type="date" value={values.dateOfBirth} onChange={e=>field("dateOfBirth",e.target.value)} /></label>
      <label>Giới tính<select value={values.gender} onChange={e=>field("gender",e.target.value)}><option value="">Chưa cập nhật</option><option value="female">Nữ</option><option value="male">Nam</option><option value="other">Khác</option></select></label>
      <label>Ngày bắt đầu làm việc *<input required type="date" value={values.startDate} onChange={e=>field("startDate",e.target.value)} /></label>
      <label className={styles.wide}>Địa chỉ<input value={values.address} onChange={e=>field("address",e.target.value)} /></label>
    </div></section>
    <section className={styles.section}><h2>Thông tin chuyên môn</h2><div className={styles.grid}>
      <label>Chuyên môn<input value={values.specialization} onChange={e=>field("specialization",e.target.value)} placeholder="Ví dụ: Tiếng Anh thiếu nhi" /></label>
      <label>Bằng cấp<input value={values.qualification} onChange={e=>field("qualification",e.target.value)} /></label>
      <label className={styles.wide}>Chứng chỉ<textarea rows={2} value={values.certificates} onChange={e=>field("certificates",e.target.value)} placeholder="Phân cách bằng dấu phẩy" /></label>
      <label>Trạng thái làm việc<select value={values.employmentStatus} onChange={e=>field("employmentStatus",e.target.value as TeacherInput["employmentStatus"])}><option value="working">Đang làm việc</option><option value="inactive">Ngừng làm việc</option></select></label>
      <label className={styles.wide}>Ghi chú<textarea rows={3} value={values.note} onChange={e=>field("note",e.target.value)} /></label>
    </div></section>
    {!teacher && <p className={styles.hint}>Mã giáo viên sẽ được tạo tự động (GV001, GV002...). Tài khoản bắt đầu ở trạng thái chờ kích hoạt; chưa gửi email mời trong phiên bản mock.</p>}
    <div className={styles.actions}><Link href={teacher?`/admin/teachers/${teacher.id}`:"/admin/teachers"}>Hủy</Link><button disabled={pending} type="submit">{pending?"Đang lưu...":teacher?"Lưu thay đổi":"Tạo giáo viên"}</button></div>
  </form>;
}
