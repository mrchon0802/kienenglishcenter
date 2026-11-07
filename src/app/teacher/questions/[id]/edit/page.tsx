import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { getCurricula } from "@/mocks/curricula";
import { getTeacherQuestionById } from "@/mocks/questions";
import { getCurrentTeacherId } from "@/lib/current-user";
import { TeacherQuestionEditor } from "../../TeacherQuestionEditor";
async function EditContent({params}:{params:Promise<{id:string}>}) {
 await connection();
  const currentTeacherId = await getCurrentTeacherId(); const {id}=await params;
 const [question,curricula]=await Promise.all([getTeacherQuestionById(id,currentTeacherId),getCurricula()]);
 if(!question || question.createdBy!==currentTeacherId) notFound();
 return <><PageHeader title="Sửa câu hỏi" subtitle={`Mã ${question.id}`}/><TeacherQuestionEditor curricula={curricula} initial={question} mode="edit"/></>;
}
export default function EditTeacherQuestionPage({params}:{params:Promise<{id:string}>}) {return <Suspense fallback={<p>Đang tải câu hỏi...</p>}><EditContent params={params}/></Suspense>}
