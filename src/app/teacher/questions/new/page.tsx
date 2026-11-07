import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { QuestionEditor } from "@/components/question-editor/QuestionEditor";
import { createEmptyQuestion } from "@/lib/question-types";
import { getCurricula } from "@/mocks/curricula";
import { getCurrentTeacherId } from "@/lib/current-user";
import { TeacherQuestionEditor } from "../TeacherQuestionEditor";

async function NewQuestionContent() {
 await connection();
 const curricula = await getCurricula();
 return <><PageHeader title="Tạo câu hỏi" subtitle="Câu hỏi sẽ được lưu vào kho học liệu trung tâm và gắn với Lesson đã chọn."/><TeacherQuestionEditor curricula={curricula}/></>;
}
export default function NewTeacherQuestionPage(){return <Suspense fallback={<p>Đang tải biểu mẫu...</p>}><NewQuestionContent/></Suspense>}
