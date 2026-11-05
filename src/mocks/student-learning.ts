export type LearningGoalStatus = "active" | "completed";
export interface LearningGoal {
  id: string;
  studentId: string;
  title: string;
  targetDate: string;
  target: number;
  progress: number;
  unit: string;
  status: LearningGoalStatus;
  createdAt: string;
}

export interface LearningMaterial {
  id: string;
  title: string;
  category: "Từ vựng" | "Ngữ pháp" | "Phát âm" | "Kỹ năng";
  level: string;
  description: string;
  content: string[];
  estimatedMinutes: number;
}

const SEED_GOALS: LearningGoal[] = [
  { id: "goal-demo-1", studentId: "hs-002", title: "Học 30 từ vựng về gia đình", targetDate: "2026-12-01", target: 30, progress: 18, unit: "từ", status: "active", createdAt: "2026-10-20T08:00:00.000Z" },
  { id: "goal-demo-2", studentId: "hs-002", title: "Hoàn thành 5 bài luyện tập", targetDate: "2026-11-20", target: 5, progress: 5, unit: "bài", status: "completed", createdAt: "2026-10-18T08:00:00.000Z" },
];

export const LEARNING_MATERIALS: LearningMaterial[] = [
  { id: "mat-family", title: "Từ vựng: My Family", category: "Từ vựng", level: "Cơ bản · Lớp 1–3", description: "Ôn tập từ vựng về các thành viên trong gia đình.", estimatedMinutes: 10, content: ["mother – mẹ", "father – bố", "sister – chị/em gái", "brother – anh/em trai", "grandmother – bà", "grandfather – ông", "Câu mẫu: This is my mother."] },
  { id: "mat-hobbies", title: "Từ vựng: Hobbies", category: "Từ vựng", level: "Cơ bản · Lớp 3–5", description: "Các hoạt động thường ngày và sở thích.", estimatedMinutes: 12, content: ["reading – đọc sách", "drawing – vẽ", "swimming – bơi", "playing football – chơi bóng đá", "singing – ca hát", "Câu mẫu: I like reading books."] },
  { id: "mat-present-simple", title: "Ngữ pháp: Present Simple", category: "Ngữ pháp", level: "Cơ bản", description: "Cách dùng thì hiện tại đơn trong câu khẳng định.", estimatedMinutes: 15, content: ["I / You / We / They + động từ nguyên mẫu.", "He / She / It + động từ thêm s/es.", "I play football every day.", "She likes music.", "Dấu hiệu thường gặp: every day, usually, often."] },
  { id: "mat-pronunciation", title: "Phát âm: Âm cuối -s / -es", category: "Phát âm", level: "Cơ bản · A1", description: "Nhận biết ba cách phát âm phổ biến của đuôi -s/-es.", estimatedMinutes: 12, content: ["/s/: books, cats, maps.", "/z/: pens, bags, plays.", "/ɪz/: buses, watches, boxes.", "Mẹo: đọc chậm từ, xác định âm cuối trước khi thêm -s/-es."] },
  { id: "mat-speaking", title: "Kỹ năng: Giới thiệu bản thân", category: "Kỹ năng", level: "A1", description: "Mẫu câu ngắn để giới thiệu tên, tuổi, lớp và sở thích.", estimatedMinutes: 10, content: ["Hello! My name is …", "I am … years old.", "I am in class …", "I like …", "Nice to meet you!"] },
];

const g = globalThis as typeof globalThis & { __ecStudentLearningGoals?: LearningGoal[] };
function goals(): LearningGoal[] {
  if (!g.__ecStudentLearningGoals) g.__ecStudentLearningGoals = structuredClone(SEED_GOALS);
  return g.__ecStudentLearningGoals;
}

export async function getStudentLearningGoals(studentId: string): Promise<LearningGoal[]> {
  return goals().filter((goal) => goal.studentId === studentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((goal) => ({ ...goal }));
}

export async function createStudentLearningGoal(input: { studentId: string; title: string; targetDate: string; target: number; unit: string }): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const title = input.title.trim();
  const unit = input.unit.trim();
  if (!title || title.length > 100) return { ok: false, error: "Tên mục tiêu phải có từ 1 đến 100 ký tự." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.targetDate) || Number.isNaN(new Date(`${input.targetDate}T00:00:00`).getTime())) return { ok: false, error: "Vui lòng chọn ngày hoàn thành hợp lệ." };
  if (!Number.isInteger(input.target) || input.target < 1 || input.target > 10000) return { ok: false, error: "Số lượng mục tiêu phải từ 1 đến 10.000." };
  if (!unit || unit.length > 20) return { ok: false, error: "Vui lòng nhập đơn vị hợp lệ." };
  const id = `goal-${Date.now().toString(36)}`;
  goals().unshift({ id, studentId: input.studentId, title, targetDate: input.targetDate, target: input.target, progress: 0, unit, status: "active", createdAt: new Date().toISOString() });
  return { ok: true, id };
}

export async function updateStudentLearningGoal(studentId: string, goalId: string, progress: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const goal = goals().find((item) => item.id === goalId && item.studentId === studentId);
  if (!goal) return { ok: false, error: "Không tìm thấy mục tiêu học tập." };
  if (!Number.isInteger(progress) || progress < 0 || progress > goal.target) return { ok: false, error: "Tiến độ phải nằm trong khoảng 0 đến mục tiêu." };
  goal.progress = progress;
  goal.status = progress >= goal.target ? "completed" : "active";
  return { ok: true };
}
