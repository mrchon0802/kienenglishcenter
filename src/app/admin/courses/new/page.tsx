import { PageHeader } from "@/components/layout/PageHeader";
import { CourseForm } from "../_components/CourseForm";

export const metadata = { title: "Tạo khóa học | Quản trị" };

export default function NewCoursePage() {
  return <><PageHeader title="Tạo khóa học" subtitle="Thiết lập chương trình học, thời lượng và học phí tiêu chuẩn." /><CourseForm /></>;
}
