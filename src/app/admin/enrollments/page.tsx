import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { getClasses } from "@/mocks/classes";
import { getCourses } from "@/mocks/courses";
import { getCourseEnrollments } from "@/mocks/course-enrollments";
import { getStudents } from "@/mocks/students";
import { EnrollmentWorkspace } from "./_components/EnrollmentWorkspace";

export const metadata = { title: "Đăng ký khóa học | Quản trị" };

async function EnrollmentContent() {
  await connection();
  const [students, courses, classes, enrollments] = await Promise.all([
    getStudents(), getCourses(), getClasses(), getCourseEnrollments(),
  ]);
  const activeStudents = students.filter((student) => student.status === "active");
  const activeCourses = courses.filter((course) => course.status === "active");
  const courseClasses = classes.map((cls) => ({ id: cls.id, name: cls.name, courseId: cls.courseId ?? "", monthlyFee: cls.monthlyFee }));
  return <>
    <PageHeader
      title="Đăng ký khóa học"
      subtitle="Quản lý học sinh tham gia Flyers, IELTS và các chương trình chuyên biệt. Không làm thay đổi lớp chính của học sinh."
    />
    <EnrollmentWorkspace students={activeStudents.map(({ id, code, fullName }) => ({ id, code, fullName }))} courses={activeCourses.map(({ id, name, standardFee }) => ({ id, name, standardFee }))} classes={courseClasses} enrollments={enrollments} />
  </>;
}

export default function EnrollmentsPage() {
  return <Suspense fallback={<p>Đang tải danh sách đăng ký...</p>}><EnrollmentContent /></Suspense>;
}
