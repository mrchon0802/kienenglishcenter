export type LessonPlanStatus = "draft" | "ready";

export interface TeacherLessonPlan {
  id: string;
  teacherId: string;
  classId: string;
  title: string;
  grade: number;
  unit: string;
  lesson: string;
  objectives: string;
  materials: string;
  warmUp: string;
  presentation: string;
  practice: string;
  production: string;
  homework: string;
  duration: number;
  status: LessonPlanStatus;
  visibility: "private" | "shared";
  createdAt: string;
  updatedAt: string;
}

export type TeacherLessonPlanInput = Pick<TeacherLessonPlan,
  "classId" | "title" | "unit" | "lesson" | "objectives" | "materials" |
  "warmUp" | "presentation" | "practice" | "production" | "homework" |
  "duration" | "status" | "visibility"
>;
