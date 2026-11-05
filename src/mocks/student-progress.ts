import { getStudentAssignments } from "./assignments";
import { getClassSessions } from "./classes";
import { getTeacherAttendance } from "./teacher-attendance";
import { getClassSessionCompletions } from "./teacher-session-completions";
import { getStudentById } from "./students";

export interface StudentProgressData {
  studentName: string;
  className: string;
  attendanceRate: number | null;
  attendedSessions: number;
  markedSessions: number;
  totalSessions: number;
  completedAssignments: number;
  totalAssignments: number;
  averageScore: number | null;
  upcomingCount: number;
  assignments: Awaited<ReturnType<typeof getStudentAssignments>>;
  lessons: Array<{ id: string; date: string; topic: string; attended: boolean | null; actualTopic: string | null; completedContent: string | null; homework: string | null }>;
}

export async function getStudentProgress(studentId: string, now = new Date()): Promise<StudentProgressData | null> {
  const student = await getStudentById(studentId);
  if (!student) return null;
  const classId = student.className.toLowerCase();
  const [assignments, sessions, completions] = await Promise.all([
    getStudentAssignments(studentId, now),
    getClassSessions(classId),
    getClassSessionCompletions(classId),
  ]);
  const completionMap = new Map(completions.map((item) => [item.sessionId, item]));
  const lessons = await Promise.all(sessions.map(async (session) => {
    const attendance = await getTeacherAttendance(classId, session.id);
    const status = attendance[studentId];
    const completion = completionMap.get(session.id);
    return {
      id: session.id, date: session.date, topic: session.topic,
      attended: status === "present" || status === "excused" ? true : status === "absent" ? false : null,
      actualTopic: completion?.actualTopic ?? null,
      completedContent: completion?.completedContent ?? null,
      homework: completion?.homework ?? null,
    };
  }));
  const marked = lessons.filter((lesson) => lesson.attended !== null);
  const attended = marked.filter((lesson) => lesson.attended === true).length;
  const scored = assignments.filter((item) => item.bestScore !== null);
  const upcoming = assignments.filter((item) => item.status === "todo");
  return {
    studentName: student.fullName, className: student.className,
    attendanceRate: marked.length ? Math.round((attended / marked.length) * 100) : null,
    attendedSessions: attended, markedSessions: marked.length, totalSessions: lessons.length,
    completedAssignments: assignments.filter((item) => item.status === "done").length,
    totalAssignments: assignments.length,
    averageScore: scored.length ? scored.reduce((sum, item) => sum + (item.bestScore ?? 0), 0) / scored.length : null,
    upcomingCount: upcoming.length, assignments, lessons,
  };
}
