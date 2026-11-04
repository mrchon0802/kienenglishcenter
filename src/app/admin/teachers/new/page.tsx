import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { TeacherForm } from "../_components/TeacherForm";
export const metadata: Metadata = { title:"Thêm giáo viên | Quản trị" };
export default function NewTeacherPage() { return <><PageHeader title="Thêm giáo viên" subtitle="Tạo hồ sơ và tài khoản giáo viên mới"/><TeacherForm/></>; }
