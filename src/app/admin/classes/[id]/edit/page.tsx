import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getClassById } from "@/mocks/classes";
import { ClassForm } from "../../_components/ClassForm";
import { getCourses } from "@/mocks/courses";
import { getTeachers, getTeacherAccount } from "@/mocks/teachers";
import { getCurrentTeacherAssignment } from "@/mocks/teacher-assignments";
import { getClassCurriculum } from "@/mocks/class-curriculum";

export const metadata: Metadata = { title: "Sửa lớp | Quản trị" };

async function EditClass({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [cls, courses, allTeachers, assignment, curriculum] = await Promise.all([
    getClassById(id),
    getCourses(),
    getTeachers(),
    getCurrentTeacherAssignment(id),
    getClassCurriculum(id),
  ]);
  if (!cls) notFound();
  const teachers = await Promise.all(allTeachers.map(async (teacher) => ({
    ...teacher,
    account: await getTeacherAccount(teacher.id),
  })));
  const teacherOptions = teachers
    .filter((teacher) =>
      (teacher.employmentStatus === "working" && teacher.account?.status === "active") ||
      teacher.id === assignment?.teacherId
    )
    .map(({ id: teacherId, teacherCode, fullName }) => ({ id: teacherId, teacherCode, fullName }));
  const course = courses.find((item) => item.id === cls.courseId);
  const progressUnits = curriculum
    ? curriculum.units.map((unit, index) => ({ value: index + 1, title: unit.title, lessons: unit.lessons.map((lesson, lessonIndex) => ({ value: lessonIndex + 1, title: lesson.title })) }))
    : (course?.units ?? []).map((unit, index) => ({ value: index + 1, title: unit.title, lessons: Array.from({ length: unit.lessons }, (_, lessonIndex) => ({ value: lessonIndex + 1, title: `Lesson ${lessonIndex + 1}` })) }));

  return (
    <>
      <PageHeader title={`Sửa lớp ${cls.name}`} subtitle="Cập nhật lịch học, giáo viên phụ trách và tiến độ giảng dạy" />
      <ClassForm key={cls.id} mode="edit" cls={cls} courses={courses} teachers={teacherOptions} currentTeacherId={assignment?.teacherId} assignmentStartDate={assignment?.startDate} progressUnits={progressUnits} />
    </>
  );
}

export default function EditClassPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Đang tải thông tin lớp...</p>}>
      <EditClass params={params} />
    </Suspense>
  );
}
