"use client";
import type { FormEvent } from "react";
import { useState } from "react";
import styles from "./settings.module.css";
type Settings={centerName:string;phone:string;email:string;address:string;academicYear:string;term:string;lateFeeNotice:boolean;assignmentNotice:boolean;attendanceNotice:boolean;currency:string};
const DEFAULT:Settings={centerName:"Kien English Center",phone:"0900 000 000",email:"hello@kienenglish.vn",address:"TP. Hồ Chí Minh",academicYear:"2026–2027",term:"Học kỳ 1",lateFeeNotice:true,assignmentNotice:true,attendanceNotice:true,currency:"VND"};
export function SettingsPanel(){
 const [data,setData]=useState(DEFAULT); const [saved,setSaved]=useState(false);
 function update<K extends keyof Settings>(key:K,value:Settings[K]){setData(old=>({...old,[key]:value}));setSaved(false);}
 function submit(e:FormEvent){e.preventDefault();setSaved(true);}
 return <div className={styles.page}>
  <header className={styles.header}><div><p className={styles.eyebrow}>ADMINISTRATION</p><h1>Cài đặt hệ thống</h1><p>Quản lý thông tin trung tâm và các tùy chọn vận hành giao diện.</p></div><span className={styles.demo}>Cấu hình mô phỏng</span></header>
  <form onSubmit={submit} className={styles.form}>
   <section className={styles.card}><h2>Thông tin trung tâm</h2><p>Thông tin hiển thị trong khu vực quản trị.</p><div className={styles.grid}>
    <label>Tên trung tâm<input value={data.centerName} onChange={e=>update("centerName",e.target.value)} required /></label>
    <label>Số điện thoại<input value={data.phone} onChange={e=>update("phone",e.target.value)} /></label>
    <label>Email<input type="email" value={data.email} onChange={e=>update("email",e.target.value)} /></label>
    <label>Địa chỉ<input value={data.address} onChange={e=>update("address",e.target.value)} /></label>
   </div></section>
   <section className={styles.card}><h2>Năm học & học kỳ</h2><p>Cấu hình nhãn năm học được sử dụng trong giao diện.</p><div className={styles.grid}>
    <label>Năm học<input value={data.academicYear} onChange={e=>update("academicYear",e.target.value)} /></label>
    <label>Học kỳ<select value={data.term} onChange={e=>update("term",e.target.value)}><option>Học kỳ 1</option><option>Học kỳ 2</option><option>Hè</option></select></label>
    <label>Đơn vị tiền tệ<select value={data.currency} onChange={e=>update("currency",e.target.value)}><option>VND</option><option>USD</option></select></label>
   </div></section>
   <section className={styles.card}><h2>Tùy chọn thông báo</h2><p>Bật/tắt các nhóm thông báo trong giao diện mô phỏng.</p>
    {([["lateFeeNotice","Nhắc học phí đến hạn"],["assignmentNotice","Nhắc hạn bài tập"],["attendanceNotice","Thông báo điểm danh"]] as const).map(([key,label])=><label className={styles.toggle} key={key}><span>{label}</span><input type="checkbox" checked={data[key]} onChange={e=>update(key,e.target.checked)} /></label>)}
   </section>
   <div className={styles.actions}><button className={styles.primary}>Lưu cài đặt</button>{saved&&<span role="status" className={styles.success}>Đã lưu trong phiên hiện tại.</span>}</div>
  </form>
  <p className={styles.note}>Lưu ý: cấu hình hiện chỉ được giữ trong state của trình duyệt; chưa áp dụng cho dữ liệu backend hoặc các module khác.</p>
 </div>;
}
