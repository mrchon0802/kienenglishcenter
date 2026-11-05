import type { Course, CourseInput } from "@/types/course";
import { getClasses } from "./classes";
import { getStudents } from "./students";

const SEED_COURSES: Course[] = [
  {
    id: "english-beginner",
    code: "ENG-BEG",
    name: "English for Beginners",
    level: "Beginner",
    description: "Làm quen với tiếng Anh nền tảng, từ vựng và giao tiếp cơ bản.",
    objectives: ["Nắm từ vựng và mẫu câu thông dụng", "Giao tiếp trong tình huống quen thuộc"],
    durationWeeks: 12,
    totalSessions: 24,
    standardFee: 3600000,
    status: "active",
    units: [
      { id: "beg-u1", title: "Introduction", lessons: 6 },
      { id: "beg-u2", title: "Everyday English", lessons: 6 },
      { id: "beg-u3", title: "Family and Friends", lessons: 6 },
      { id: "beg-u4", title: "Daily Activities", lessons: 6 },
    ],
    createdAt: "2026-01-10",
  },
  {
    id: "english-elementary",
    code: "ENG-ELE",
    name: "English Elementary",
    level: "Elementary",
    description: "Củng cố ngữ pháp và phát triển bốn kỹ năng tiếng Anh.",
    objectives: ["Sử dụng cấu trúc câu cơ bản", "Đọc hiểu đoạn văn ngắn"],
    durationWeeks: 16,
    totalSessions: 32,
    standardFee: 4800000,
    status: "active",
    units: [
      { id: "ele-u1", title: "People and Places", lessons: 8 },
      { id: "ele-u2", title: "Past and Present", lessons: 8 },
      { id: "ele-u3", title: "Around the World", lessons: 8 },
      { id: "ele-u4", title: "Future Plans", lessons: 8 },
    ],
    createdAt: "2026-02-05",
  },
  {
    id: "english-intermediate",
    code: "ENG-INT",
    name: "English Intermediate",
    level: "Intermediate",
    description: "Phát triển khả năng sử dụng tiếng Anh độc lập trong học tập và công việc.",
    objectives: ["Trình bày ý kiến rõ ràng", "Đọc hiểu nội dung trung cấp"],
    durationWeeks: 20,
    totalSessions: 40,
    standardFee: 6200000,
    status: "active",
    units: [
      { id: "int-u1", title: "Communication", lessons: 10 },
      { id: "int-u2", title: "Experiences", lessons: 10 },
      { id: "int-u3", title: "Society", lessons: 10 },
      { id: "int-u4", title: "Career and Study", lessons: 10 },
    ],
    createdAt: "2026-03-01",
  },
];

type CourseStore = typeof globalThis & { __ecCourses?: Course[] };
const store = globalThis as CourseStore;

function courseList(): Course[] {
  if (!store.__ecCourses) store.__ecCourses = structuredClone(SEED_COURSES);
  return store.__ecCourses;
}

export async function getCourses(): Promise<Course[]> {
  return courseList().map((course) => structuredClone(course));
}

export async function getCourseById(id: string): Promise<Course | undefined> {
  const course = courseList().find((item) => item.id === id);
  return course ? structuredClone(course) : undefined;
}

export async function getCourseUsage(courseId: string) {
  const [classes, students] = await Promise.all([getClasses(), getStudents()]);
  const linkedClasses = classes.filter((item) => item.courseId === courseId);
  const classNames = new Set(linkedClasses.map((item) => item.name));
  return {
    classes: linkedClasses,
    studentCount: students.filter((student) => student.status === "active" && classNames.has(student.className)).length,
  };
}

export async function createCourse(input: CourseInput): Promise<Course> {
  const id = input.code.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const course: Course = { ...structuredClone(input), id, code: input.code.trim().toUpperCase(), name: input.name.trim(), createdAt: new Date().toISOString().slice(0, 10) };
  courseList().push(course);
  return structuredClone(course);
}

export async function updateCourse(id: string, input: CourseInput): Promise<Course | null> {
  const course = courseList().find((item) => item.id === id);
  if (!course) return null;
  Object.assign(course, structuredClone(input), { code: input.code.trim().toUpperCase(), name: input.name.trim() });
  return structuredClone(course);
}

export async function deleteCourse(id: string): Promise<boolean> {
  const linked = (await getClasses()).some((item) => item.courseId === id);
  if (linked) return false;
  const index = courseList().findIndex((item) => item.id === id);
  if (index < 0) return false;
  courseList().splice(index, 1);
  return true;
}
