import type { TeacherSessionCompletion, TeacherSessionCompletionInput } from "@/types/teacher-session-completion";
import { getSessionById, getClassById } from "./classes";
import { getTeacherAssignments } from "./teacher-assignments";
import { getClassCurriculum } from "./class-curriculum";

interface Store { items: TeacherSessionCompletion[] }
const g = globalThis as typeof globalThis & { __ecTeacherSessionCompletions?: Store };
function store(): Store {
  if (!g.__ecTeacherSessionCompletions) g.__ecTeacherSessionCompletions = { items: [] };
  return g.__ecTeacherSessionCompletions;
}

async function canManage(teacherId: string, classId: string): Promise<boolean> {
  const [assignments, cls] = await Promise.all([getTeacherAssignments(), getClassById(classId)]);
  return Boolean(cls && assignments.some((item) => item.teacherId === teacherId && item.classId === classId && !item.endDate));
}

export async function getTeacherSessionCompletion(classId: string, sessionId: string, teacherId: string): Promise<TeacherSessionCompletion | null> {
  if (!(await canManage(teacherId, classId))) return null;
  const session = await getSessionById(classId, sessionId);
  if (!session) return null;
  const item = store().items.find((entry) => entry.classId === classId && entry.sessionId === sessionId);
  return item ? { ...item } : null;
}

export async function saveTeacherSessionCompletion(teacherId: string, input: TeacherSessionCompletionInput): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!(await canManage(teacherId, input.classId))) return { ok: false, error: "Bạn không được phân công lớp này." };
  const session = await getSessionById(input.classId, input.sessionId);
  if (!session) return { ok: false, error: "Không tìm thấy buổi học." };
  if (!input.actualTopic.trim() || !input.completedContent.trim()) return { ok: false, error: "Vui lòng nhập chủ đề và nội dung đã thực hiện." };
  if (input.curriculumLessonCompleted) {
    if (!input.curriculumId || !input.curriculumUnitId || !input.curriculumLessonId) {
      return { ok: false, error: "Vui lòng chọn Lesson trong giáo trình trước khi xác nhận hoàn thành." };
    }
    const curriculum = await getClassCurriculum(input.classId);
    if (!curriculum || curriculum.id !== input.curriculumId) {
      return { ok: false, error: "Giáo trình này chưa được gán cho lớp hoặc đã thay đổi." };
    }
    const lesson = curriculum.units
      .find((unit) => unit.id === input.curriculumUnitId)
      ?.lessons.find((item) => item.id === input.curriculumLessonId);
    if (!lesson) return { ok: false, error: "Lesson đã chọn không thuộc giáo trình của lớp." };
    const alreadyCompleted = store().items.some((entry) =>
      entry.classId === input.classId &&
      entry.sessionId !== input.sessionId &&
      entry.curriculumLessonId === input.curriculumLessonId &&
      entry.curriculumLessonCompleted
    );
    if (alreadyCompleted) return { ok: false, error: "Lesson này đã được xác nhận hoàn thành ở một buổi học khác." };
    input.curriculumLessonTitle = lesson.title;
  }
  if (!Number.isInteger(input.actualDuration) || input.actualDuration < 10 || input.actualDuration > 240) return { ok: false, error: "Thời lượng thực tế phải từ 10 đến 240 phút." };
  const now = new Date().toISOString();
  const existing = store().items.find((entry) => entry.classId === input.classId && entry.sessionId === input.sessionId);
  if (existing) {
    if (existing.teacherId !== teacherId) return { ok: false, error: "Bạn không có quyền cập nhật biên bản này." };
    Object.assign(existing, input, { updatedAt: now });
    return { ok: true, id: existing.id };
  }
  const id = `completion-${Date.now().toString(36)}`;
  store().items.unshift({ ...input, id, teacherId, completedAt: now, updatedAt: now });
  return { ok: true, id };
}

export async function getTeacherCompletionStats(teacherId: string, classIds: string[]) {
  const allowed = new Set(classIds);
  const [assignments] = await Promise.all([getTeacherAssignments()]);
  const assigned = new Set(assignments.filter((item) => item.teacherId === teacherId && !item.endDate).map((item) => item.classId));
  return store().items.filter((item) => item.teacherId === teacherId && allowed.has(item.classId) && assigned.has(item.classId));
}

/** Gắn bài tập đã giao vào biên bản để chống tạo trùng khi gửi lại. */
export async function attachCompletionAssignment(
  classId: string, sessionId: string, teacherId: string, assignmentId: string,
): Promise<boolean> {
  if (!(await canManage(teacherId, classId))) return false;
  const item = store().items.find((entry) => entry.classId === classId && entry.sessionId === sessionId && entry.teacherId === teacherId);
  if (!item) return false;
  item.autoAssignmentId = assignmentId;
  item.updatedAt = new Date().toISOString();
  return true;
}

/** Lấy biên bản các buổi học của một lớp để Student Portal hiển thị lịch sử học tập. */
export async function getClassSessionCompletions(classId: string): Promise<TeacherSessionCompletion[]> {
  return store().items
    .filter((item) => item.classId === classId)
    .map((item) => ({ ...item }))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}
