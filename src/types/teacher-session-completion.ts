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
}

export type TeacherSessionCompletionInput = Omit<TeacherSessionCompletion, "id" | "teacherId" | "completedAt" | "updatedAt">;
