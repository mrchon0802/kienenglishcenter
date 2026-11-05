export type CourseLevel =
  | "Beginner"
  | "Elementary"
  | "Pre-Intermediate"
  | "Intermediate"
  | "Upper-Intermediate"
  | "Advanced";

export interface CourseUnit {
  id: string;
  title: string;
  lessons: number;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  level: CourseLevel;
  description: string;
  objectives: string[];
  durationWeeks: number;
  totalSessions: number;
  standardFee: number;
  status: "active" | "inactive";
  units: CourseUnit[];
  createdAt: string;
}

export type CourseInput = Omit<Course, "id" | "createdAt">;
