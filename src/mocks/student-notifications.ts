import type { StudentNotification } from "@/types/student-notification";
interface Store { items: StudentNotification[]; counter: number }
const g = globalThis as typeof globalThis & { __ecStudentNotifications?: Store };
function store(): Store { if (!g.__ecStudentNotifications) g.__ecStudentNotifications = { items: [], counter: 0 }; return g.__ecStudentNotifications; }

export async function createAssignmentNotifications(assignmentId: string, title: string, classId: string, studentIds: string[]) {
  const s = store(); const createdAt = new Date().toISOString();
  for (const studentId of studentIds) {
    if (s.items.some((n) => n.assignmentId === assignmentId && n.studentId === studentId)) continue;
    s.counter += 1;
    s.items.unshift({ id: `sn-${s.counter}`, studentId, title: "Bài tập mới được giao", message: `Giáo viên đã giao bài “${title}” cho lớp của bạn.`, href: `/student/assignments/${assignmentId}`, createdAt, readAt: null, assignmentId, category: "assignment" });
  }
}

export async function createStudentSystemNotification(input: {
  studentId: string; sourceId: string; category: "tuition" | "schedule";
  title: string; message: string; href: string;
}) {
  const s = store();
  if (s.items.some((item) => item.studentId === input.studentId && item.sourceId === input.sourceId)) return;
  s.counter += 1;
  s.items.unshift({
    id: `sn-${s.counter}`, studentId: input.studentId, title: input.title,
    message: input.message, href: input.href, createdAt: new Date().toISOString(),
    readAt: null, assignmentId: "", category: input.category, sourceId: input.sourceId,
  });
}

export async function createClassScheduleNotifications(classId: string, className: string, studentIds: string[]) {
  for (const studentId of studentIds) {
    await createStudentSystemNotification({
      studentId, sourceId: `schedule-${classId}-${Date.now()}`,
      category: "schedule", title: "Lịch học của lớp vừa thay đổi",
      message: `Trung tâm vừa cập nhật lịch học lớp ${className}. Em hãy kiểm tra thời gian học mới.`,
      href: "/student/schedule",
    });
  }
}

export async function getStudentNotifications(studentId: string) {
  return store().items.filter((n) => n.studentId === studentId).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
}
export async function markStudentNotificationRead(id: string, studentId: string) {
  const item = store().items.find((n) => n.id === id && n.studentId === studentId);
  if (!item) return false;
  item.readAt = new Date().toISOString();
  return true;
}
