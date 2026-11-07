"use client";
import type { Curriculum } from "@/types/curriculum";
import { QuestionEditor } from "@/components/question-editor/QuestionEditor";
import { createEmptyQuestion } from "@/lib/question-types";
export function TeacherQuestionEditor({curricula,initial=createEmptyQuestion("mcq"),mode="new"}:{curricula:Curriculum[];initial?:ReturnType<typeof createEmptyQuestion>;mode?:"new"|"edit"}) {
 return <QuestionEditor mode={mode} initial={initial} curricula={curricula} teacherMode />;
}
