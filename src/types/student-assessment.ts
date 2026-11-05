export type AssessmentKind = "progress" | "periodic" | "final";

export interface SkillScores {
  listening: number;
  speaking: number;
  reading: number;
  writing: number;
}

export interface StudentAssessment {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  classId: string;
  className: string;
  teacherId: string;
  kind: AssessmentKind;
  assessedAt: string;
  curriculumId: string | null;
  curriculumLessonId: string | null;
  curriculumLessonTitle: string;
  scores: SkillScores;
  strengths: string;
  improvements: string;
  teacherComment: string;
  createdAt: string;
}

export type StudentAssessmentInput = Omit<StudentAssessment,
  "id" | "studentName" | "studentCode" | "className" | "teacherId" | "createdAt"
>;
