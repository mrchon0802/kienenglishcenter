import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getTeacherById } from "@/mocks/teachers";
import { TeacherForm } from "../../_components/TeacherForm";
export const metadata: Metadata = { title:"Sửa hồ sơ giáo viên | Quản trị" };
async function EditTeacher({params}:{params:Promise<{id:string}>}) { const {id}=await params; const teacher=await getTeacherById(id); if(!teacher) notFound(); return <><PageHeader title={`Sửa: ${teacher.fullName}`} subtitle={`Mã ${teacher.teacherCode}`}/><TeacherForm key={teacher.id} teacher={teacher}/></>; }
export default function EditTeacherPage({params}:{params:Promise<{id:string}>}) { return <Suspense fallback={<p>Đang tải hồ sơ giáo viên...</p>}><EditTeacher params={params}/></Suspense>; }
