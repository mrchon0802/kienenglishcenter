"use client";
import { useState, useTransition } from "react";
import { copyTeacherQuestionAction } from "./actions";
export function CopyQuestionButton({ questionId }: { questionId: string }) {
 const [pending,start] = useTransition(); const [message,setMessage] = useState("");
 return <button type="button" disabled={pending} onClick={() => start(async () => { const r=await copyTeacherQuestionAction(questionId); setMessage(r.ok ? "Đã sao chép thành câu hỏi riêng." : r.error); })}>{pending ? "Đang sao chép..." : "Sao chép để chỉnh sửa"}{message ? ` · ${message}` : ""}</button>;
}
