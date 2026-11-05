import type { CourseEnrollment, CourseEnrollmentInput, CourseEnrollmentRow, CourseEnrollmentStatus } from "@/types/course-enrollment";
import { getClasses } from "./classes";
import { getCourses } from "./courses";
import { getStudents } from "./students";

type Store = typeof globalThis & { __ecCourseEnrollments?: CourseEnrollment[] };
const store = globalThis as Store;

function enrollmentList(): CourseEnrollment[] {
  if (!store.__ecCourseEnrollments) store.__ecCourseEnrollments = [];
  return store.__ecCourseEnrollments;
}

export async function getCourseEnrollments(): Promise<CourseEnrollmentRow[]> {
  const [enrollments, students, courses, classes] = await Promise.all([
    Promise.resolve(enrollmentList()), getStudents(), getCourses(), getClasses(),
  ]);
  const studentMap = new Map(students.map((item) => [item.id, item]));
  const courseMap = new Map(courses.map((item) => [item.id, item]));
  const classMap = new Map(classes.map((item) => [item.id, item]));
  return enrollments
    .map((item) => {
      const student = studentMap.get(item.studentId);
      const course = courseMap.get(item.courseId);
      const cls = classMap.get(item.classId);
      if (!student || !course || !cls) return null;
      return {
        ...item,
        studentName: student.fullName,
        studentCode: student.code,
        courseName: course.name,
        className: cls.name,
      } satisfies CourseEnrollmentRow;
    })
    .filter((item): item is CourseEnrollmentRow => item !== null)
    .sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt));
}

export async function createCourseEnrollment(input: CourseEnrollmentInput): Promise<CourseEnrollment | null> {
  const [students, courses, classes] = await Promise.all([getStudents(), getCourses(), getClasses()]);
  const student = students.find((item) => item.id === input.studentId && item.status === "active");
  const course = courses.find((item) => item.id === input.courseId && item.status === "active");
  const cls = classes.find((item) => item.id === input.classId && item.courseId === input.courseId);
  if (!student || !course || !cls) return null;

  const duplicate = enrollmentList().some((item) =>
    item.studentId === input.studentId && item.classId === input.classId && item.status === "active",
  );
  if (duplicate) return null;

  const enrollment: CourseEnrollment = {
    id: `ce-${Date.now()}-${enrollmentList().length + 1}`,
    ...input,
    fee: Math.round(input.fee),
    status: "active",
    note: input.note.trim(),
  };
  enrollmentList().push(enrollment);
  return structuredClone(enrollment);
}

export async function updateCourseEnrollmentStatus(id: string, status: CourseEnrollmentStatus): Promise<boolean> {
  const item = enrollmentList().find((enrollment) => enrollment.id === id);
  if (!item) return false;
  if (status === "active" && enrollmentList().some((enrollment) =>
    enrollment.id !== id && enrollment.studentId === item.studentId && enrollment.classId === item.classId && enrollment.status === "active",
  )) return false;
  item.status = status;
  return true;
}
