"use client";
import { useMemo, useState } from "react";
import styles from "../../page.module.css";
interface Row { id:string; code:string; name:string; phone:string; email:string; specialization:string; employment:string; status:string; }
export function TeacherList({rows}:{rows:Row[]}) {
 const [query,setQuery]=useState(""); const [status,setStatus]=useState("all");
 const filtered=useMemo(()=>rows.filter(row=>{const q=query.trim().toLowerCase();const matches=!q||[row.code,row.name,row.phone,row.email].some(v=>v.toLowerCase().includes(q));return matches&&(status==="all"||row.status===status);}),[rows,query,status]);
 return <div className={styles.wrap}><div className={styles.toolbar}><input aria-label="Tìm giáo viên" placeholder="Tìm theo mã, tên, số điện thoại hoặc email..." value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Lọc trạng thái tài khoản" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">Tất cả tài khoản</option><option value="pending_activation">Chờ kích hoạt</option><option value="active">Đang hoạt động</option><option value="locked">Đã khóa</option></select><span className={styles.muted}>{filtered.length}/{rows.length} giáo viên</span></div>
 <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Mã GV</th><th>Họ và tên</th><th>Liên hệ</th><th>Chuyên môn</th><th>Làm việc</th><th>Tài khoản</th><th></th></tr></thead><tbody>
 {filtered.map(row=><tr key={row.id}><td>{row.code}</td><td><strong>{row.name}</strong></td><td>{row.phone}<br/><span className={styles.muted}>{row.email}</span></td><td>{row.specialization||"—"}</td><td>{row.employment==="working"?"Đang làm việc":"Ngừng làm việc"}</td><td><span className={`${styles.status} ${row.status==="active"?styles.active:row.status==="locked"?styles.locked:""}`}>{row.status==="active"?"Đang hoạt động":row.status==="locked"?"Đã khóa":"Chờ kích hoạt"}</span></td><td><a href={`/admin/teachers/${row.id}`}>Chi tiết</a></td></tr>)}
 {!filtered.length&&<tr><td colSpan={7} className={styles.empty}>Không tìm thấy giáo viên phù hợp.</td></tr>}</tbody></table></div></div>;
}
