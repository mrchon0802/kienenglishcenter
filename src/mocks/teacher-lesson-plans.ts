import type { TeacherLessonPlan, TeacherLessonPlanInput } from "@/types/teacher-lesson-plan";
import { getClassById } from "./classes";
import { getTeacherAssignments } from "./teacher-assignments";

const SEED: TeacherLessonPlan[] = [
  {
    id: "plan-demo-1", teacherId: "gv-001", classId: "1a", title: "Unit 2 – My family: Vocabulary",
    grade: 1, unit: "Unit 2", lesson: "Lesson 1 – Vocabulary", objectives: "Học sinh nhận biết và gọi tên được các thành viên trong gia đình bằng tiếng Anh.",
    materials: "Flashcards, tranh minh họa, loa", warmUp: "Chào hỏi và chơi trò đoán tranh (5 phút).",
    presentation: "Giới thiệu từ vựng family, mother, father, sister, brother (10 phút).",
    practice: "Luyện phát âm theo nhóm và ghép từ với tranh (15 phút).",
    production: "Học sinh giới thiệu một thành viên trong gia đình (10 phút).", homework: "Ôn 5 từ mới và vẽ sơ đồ gia đình.",
    duration: 40, status: "ready", visibility: "shared", createdAt: "2026-10-10T08:00:00.000Z", updatedAt: "2026-10-12T08:00:00.000Z",
  },
  {
    id: "plan-demo-2", teacherId: "gv-001", classId: "3a", title: "Unit 4 – Our hobbies: Speaking",
    grade: 3, unit: "Unit 4", lesson: "Lesson 2 – Speaking", objectives: "Học sinh hỏi và trả lời được về sở thích đơn giản.",
    materials: "Flashcards, bảng, phiếu luyện nói", warmUp: "Ôn từ vựng bằng trò chơi nhanh (5 phút).",
    presentation: "Mẫu câu What do you like doing? – I like… (10 phút).",
    practice: "Luyện hỏi đáp theo cặp, đổi vai (15 phút).",
    production: "Trình bày sở thích trước lớp (10 phút).", homework: "Viết 3 câu về sở thích của bản thân.",
    duration: 40, status: "draft", visibility: "private", createdAt: "2026-10-14T08:00:00.000Z", updatedAt: "2026-10-14T08:00:00.000Z",
  },
];

interface Store { plans: TeacherLessonPlan[] }
const g = globalThis as typeof globalThis & { __ecTeacherLessonPlans?: Store };
function store(): Store {
  if (!g.__ecTeacherLessonPlans) g.__ecTeacherLessonPlans = { plans: structuredClone(SEED) };
  return g.__ecTeacherLessonPlans;
}

export async function getTeacherLessonPlans(teacherId: string): Promise<TeacherLessonPlan[]> {
  const assignments = await getTeacherAssignments();
  const assignedClassIds = new Set(assignments.filter((item) => item.teacherId === teacherId && !item.endDate).map((item) => item.classId));
  return store().plans.filter((plan) => plan.teacherId === teacherId || (plan.visibility === "shared" && assignedClassIds.has(plan.classId)))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getTeacherLessonPlanById(planId: string, teacherId: string): Promise<TeacherLessonPlan | null> {
  const plan = store().plans.find((item) => item.id === planId);
  if (!plan) return null;
  const assignments = await getTeacherAssignments();
  const assigned = assignments.some((item) => item.teacherId === teacherId && item.classId === plan.classId && !item.endDate);
  if (plan.teacherId !== teacherId && !(plan.visibility === "shared" && assigned)) return null;
  return { ...plan };
}

export async function saveTeacherLessonPlan(teacherId: string, input: TeacherLessonPlanInput, planId?: string): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const assignments = await getTeacherAssignments();
  const assigned = assignments.some((item) => item.teacherId === teacherId && item.classId === input.classId && !item.endDate);
  if (!assigned) return { ok: false, error: "Bạn chỉ có thể tạo giáo án cho lớp đang được phân công." };
  const cls = await getClassById(input.classId);
  if (!cls) return { ok: false, error: "Không tìm thấy lớp học." };
  const title = input.title.trim();
  if (!title || !input.unit.trim() || !input.lesson.trim() || !input.objectives.trim()) return { ok: false, error: "Vui lòng nhập tiêu đề, Unit, Lesson và mục tiêu bài học." };
  if (!Number.isFinite(input.duration) || input.duration < 10 || input.duration > 180) return { ok: false, error: "Thời lượng phải từ 10 đến 180 phút." };
  const now = new Date().toISOString();
  if (planId) {
    const existing = store().plans.find((item) => item.id === planId);
    if (!existing || existing.teacherId !== teacherId) return { ok: false, error: "Bạn không có quyền chỉnh sửa giáo án này." };
    Object.assign(existing, { ...input, title, grade: cls.grade, updatedAt: now });
    return { ok: true, id: existing.id };
  }
  const id = `plan-${Date.now().toString(36)}`;
  store().plans.unshift({ ...input, title, id, teacherId, grade: cls.grade, createdAt: now, updatedAt: now });
  return { ok: true, id };
}
