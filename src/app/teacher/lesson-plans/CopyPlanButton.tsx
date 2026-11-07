"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { copyTeacherLessonPlanAction } from "./actions";
export function CopyPlanButton({ planId }: { planId: string }) {
 const router = useRouter(); const [pending, startTransition] = useTransition(); const [error, setError] = useState("");
 return <span><button className="copyPlanButton" type="button" disabled={pending} onClick={() => startTransition(async () => { const result = await copyTeacherLessonPlanAction(planId); if (result.ok) router.push(`/teacher/lesson-plans/${result.id}/edit`); else setError(result.error); })}>{pending ? "Đang sao chép..." : "Sao chép để chỉnh sửa"}</button>{error ? <small role="alert">{error}</small> : null}</span>;
}
