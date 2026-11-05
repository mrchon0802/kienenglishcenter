export interface TeacherSessionCompletion {
  id: string;
  classId: string;
  sessionId: string;
  teacherId: string;
  lessonPlanId: string;
  actualTopic: string;
  completedContent: string;
  homework: string;
  nextLesson: string;
  notes: string;
  actualDuration: number;
  completedAt: string;
  updatedAt: string;
  autoAssignmentId?: string;
  curriculumId?: string;
  curriculumUnitId?: string;
  curriculumLessonId?: string;
  curriculumLessonTitle?: string;
  curriculumLessonCompleted?: boolean;
}

export type TeacherSessionCompletionInput = Omit<TeacherSessionCompletion, "id" | "teacherId" | "completedAt" | "updatedAt">;
