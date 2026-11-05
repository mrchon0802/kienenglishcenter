"use client";
import { useMemo, useState } from "react";
import styles from "./tasks.module.css";
type Task = { id:number; title:string; due:string; done:boolean; category:string };
const INITIAL:Task[]=[
{id:1,title:"Chuẩn bị giáo án Unit tiếp theo",due:"2026-11-07",done:false,category:"Giáo án"},
{id:2,title:"Chấm bài kiểm tra lớp 1A",due:"2026-11-08",done:false,category:"Chấm bài"},
{id:3,title:"Nhận xét tiến độ học viên lớp 3A",due:"2026-11-10",done:true,category:"Theo dõi học viên"},
];
export function TeachingTasks(){
 const [tasks,setTasks]=useState(INITIAL); const [title,setTitle]=useState(""); const [due,setDue]=useState(""); const [category,setCategory]=useState("Khác"); const [filter,setFilter]=useState("all");
 const shown=useMemo(()=>tasks.filter(t=>filter==="all"||(filter==="open"?!t.done:t.done)),[tasks,filter]);
 function add(){if(!title.trim()||!due)return;setTasks(old=>[{id:Math.max(0,...old.map(t=>t.id))+1,title:title.trim(),due,done:false,category},...old]);setTitle("");setDue("");}
 return <div className={styles.wrap}>
  <form className={styles.form} onSubmit={e=>{e.preventDefault();add();}}>
   <h2>Thêm công việc</h2><label>Tên công việc<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ví dụ: chuẩn bị tài liệu..." required /></label>
   <div className={styles.formRow}><label>Hạn hoàn thành<input type="date" value={due} onChange={e=>setDue(e.target.value)} required /></label><label>Loại công việc<select value={category} onChange={e=>setCategory(e.target.value)}><option>Giáo án</option><option>Chấm bài</option><option>Theo dõi học viên</option><option>Khác</option></select></label></div>
   <button className={styles.primary}>Thêm công việc</button>
  </form>
  <div className={styles.listHead}><h2>Danh sách công việc</h2><select aria-label="Lọc công việc" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Tất cả</option><option value="open">Chưa hoàn thành</option><option value="done">Đã hoàn thành</option></select></div>
  {shown.map(t=><article className={styles.task} key={t.id}><label className={styles.taskMain}><input type="checkbox" checked={t.done} onChange={e=>setTasks(old=>old.map(x=>x.id===t.id?{...x,done:e.target.checked}:x))}/><span><strong className={t.done?styles.completed:""}>{t.title}</strong><small>{t.category} · Hạn {new Date(t.due+"T00:00:00").toLocaleDateString("vi-VN")}</small></span></label><span className={t.done?styles.done:styles.pending}>{t.done?"Hoàn thành":"Đang thực hiện"}</span></article>)}
  {!shown.length&&<p className={styles.empty}>Không có công việc phù hợp.</p>}
 </div>
}
