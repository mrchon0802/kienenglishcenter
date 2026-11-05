import { PageHeader } from "@/components/layout/PageHeader";
import { getCourses } from "@/mocks/courses";
import { CurriculumForm } from "../_components/CurriculumForm";

export const metadata = { title: "Tạo giáo trình | Quản trị" };

export default async function NewCurriculumPage() {
  const courses = await getCourses();
  return <>
    <PageHeader title="Tạo giáo trình" subtitle="Tạo giáo trình cho một khối lớp hoặc khóa học chuyên biệt." />
    <CurriculumForm courses={courses} />
  </>;
}
