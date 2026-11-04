"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { assignTeacherAction, unassignTeacherAction } from "./assignment-actions";
import styles from "./assignments.module.css";

type ClassRow = {classId:string;className:string;grade:number;teacherId?:string;teacherName?:string;teacherCode?:string;startDate?:string};
type TeacherOption = {id:string;teacherCode:string;fullName:string};
type HistoryRow = {id:string;teacherId:string;classId:string;startDate:string;endDate?:string;reason?:string;teacherName:string;teacherCode:string;className:string};
export function AssignmentManager({classes,teachers,history}:{classes:ClassRow[];teachers:TeacherOption[];history:HistoryRow[]}) {
  const router=useRouter(); const [pending,start]=useTransition(); const [message,setMessage]=useState(""); const [error,setError]=useState("");
  async function submit(action:(data:FormData)=>Promise<{ok:boolean;error?:string}>, form:HTMLFormElement) {
    setMessage("");setError(""); const result=await action(new FormData(form));
    if(!result.ok){setError(result.error??"Có lỗi xảy ra.");return;}
    setMessage("Đã cập nhật phân công giáo viên."); form.reset(); router.refresh();
  }
  return <div className={styles.wrap}>
    <section className={styles.intro}><div><h2>Phân công hiện tại</h2><p>Mỗi lớp có tối đa một giáo viên chính. Một giáo viên có thể phụ trách nhiều lớp.</p></div><span>{classes.length} lớp</span></section>
    {(message||error)&&<p className={error?styles.error:styles.success} role={error?"alert":"status"}>{error||message}</p>}
    <div className={styles.grid}>
      {classes.map((cls)=><article className={styles.card} key={cls.classId}>
        <div className={styles.cardHead}><div><h3>Lớp {cls.className}</h3><p>Khối {cls.grade}</p></div><span className={cls.teacherId?styles.assigned:styles.unassigned}>{cls.teacherId?"Đã phân công":"Chưa có giáo viên"}</span></div>
        <div className={styles.current}>{cls.teacherName?<><strong>{cls.teacherName}</strong><span>{cls.teacherCode} · Từ {cls.startDate}</span></>:<span>Chưa có giáo viên phụ trách</span>}</div>
        <form className={styles.form} onSubmit={(event)=>{event.preventDefault();const form=event.currentTarget;start(async()=>{await submit(assignTeacherAction,form);});}}>
          <input type="hidden" name="classId" value={cls.classId}/>
          <label> {cls.teacherId?"Giáo viên thay thế":"Chọn giáo viên phụ trách"}
            <select name="teacherId" required defaultValue=""><option value="" disabled>Chọn giáo viên</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.teacherCode} – {t.fullName}</option>)}</select>
          </label>
          <label>Ngày bắt đầu<input name="startDate" type="date" defaultValue="2026-11-04" required/></label>
          <label>Lý do (không bắt buộc)<input name="reason" placeholder={cls.teacherId?"Ví dụ: Thay đổi lịch giảng dạy":"Ví dụ: Phân công đầu năm"}/></label>
          <button type="submit" disabled={pending}>{pending?"Đang lưu...":cls.teacherId?"Thay thế giáo viên":"Phân công giáo viên"}</button>
        </form>
        {cls.teacherId&&<form className={styles.unassign} onSubmit={(event)=>{event.preventDefault();const form=event.currentTarget;start(async()=>{await submit(unassignTeacherAction,form);});}}>
          <input type="hidden" name="classId" value={cls.classId}/><label>Ngày kết thúc<input name="endDate" type="date" defaultValue="2026-11-04" required/></label><label>Lý do<input name="reason" placeholder="Lý do kết thúc phân công"/></label><button type="submit" disabled={pending}>Gỡ giáo viên khỏi lớp</button>
        </form>}
      </article>)}
    </div>
    <section className={styles.history}><div className={styles.historyHead}><h2>Lịch sử phân công</h2><span>{history.length} lượt</span></div>
      <div className={styles.tableWrap}><table><thead><tr><th>Lớp</th><th>Giáo viên</th><th>Từ ngày</th><th>Đến ngày</th><th>Ghi chú</th></tr></thead><tbody>
        {history.map(item=><tr key={item.id}><td>{item.className}</td><td>{item.teacherCode} – {item.teacherName}</td><td>{item.startDate}</td><td>{item.endDate??<span className={styles.present}>Đang phụ trách</span>}</td><td>{item.reason||"—"}</td></tr>)}
        {!history.length&&<tr><td colSpan={5}>Chưa có lịch sử phân công.</td></tr>}
      </tbody></table></div>
    </section>
  </div>;
}
