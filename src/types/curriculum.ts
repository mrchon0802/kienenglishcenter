export type CurriculumTarget =
  | { type: "grade"; grade: number; courseId?: never }
  | { type: "course"; courseId: string; grade?: never };

export interface CurriculumLesson {
  id: string;
  title: string;
  objectives: string;
  durationMinutes: number;
  materials: string;
  materialUrl: string;
  homework: string;
}

export interface CurriculumUnit {
  id: string;
  title: string;
  description: string;
  lessons: CurriculumLesson[];
}

export interface Curriculum {
  id: string;
  code: string;
  title: string;
  description: string;
  targetType: "grade" | "course";
  grade: number | null;
  courseId: string | null;
  status: "active" | "inactive";
  units: CurriculumUnit[];
  createdAt: string;
  updatedAt: string;
}

export type CurriculumInput = Omit<Curriculum, "id" | "createdAt" | "updatedAt">;
