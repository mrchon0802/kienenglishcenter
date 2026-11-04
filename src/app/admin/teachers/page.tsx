import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { getTeachers, getTeacherAccount } from "@/mocks/teachers";
import { TeacherList } from "./_components/TeacherList";
export const metadata: Metadata = { title:"Giáo viên | Quản trị" };
export default async function TeachersPage() {
 const teachers=await getTeachers();
 const rows=await Promise.all(teachers.map(async teacher=>({id:teacher.id,code:teacher.teacherCode,name:teacher.fullName,phone:teacher.phoneNumber,email:teacher.email,specialization:teacher.specialization??"",employment:teacher.employmentStatus,status:(await getTeacherAccount(teacher.id))?.status??"pending_activation"})));
 return <><PageHeader title="Giáo viên" subtitle={`${teachers.length} giáo viên · Dữ liệu mock`} actions={<><Button href="/admin/teachers/assignments" variant="secondary">Phân công lớp</Button><Button href="/admin/teachers/new" variant="primary">+ Thêm giáo viên</Button></>}/><TeacherList rows={rows}/></>;
}
