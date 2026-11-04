"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setTeacherStatusAction } from "../actions";
import styles from "./actions.module.css";
export function TeacherAccountActions({id,status}:{id:string;status:"pending_activation"|"active"|"locked"}) {
  const router=useRouter(); const [pending,start]=useTransition(); const [error,setError]=useState("");
  const next=status==="locked"?"active":"locked";
  function update(){setError("");start(async()=>{const result=await setTeacherStatusAction(id,next);if(!result.ok)setError(result.error);else router.refresh();});}
  return <div className={styles.actions}><button type="button" disabled={pending||status==="pending_activation"} onClick={update}>{pending?"Đang cập nhật...":status==="locked"?"Mở khóa tài khoản":"Khóa tài khoản"}</button>{status==="pending_activation"&&<span>Tài khoản đang chờ giáo viên kích hoạt.</span>}{error&&<p role="alert">{error}</p>}</div>;
}
