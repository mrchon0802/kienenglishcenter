import type { Curriculum, CurriculumInput } from "@/types/curriculum";
import { getCourses } from "./courses";

const SEED_CURRICULA: Curriculum[] = [
  {
    id: "curriculum-grade-3",
    code: "GRADE-03",
    title: "Giáo trình tiếng Anh lớp 3",
    description: "Chương trình nền tảng dành cho học sinh khối 3.",
    targetType: "grade",
    grade: 3,
    courseId: null,
    status: "active",
    units: [
      {
        id: "g3-u1",
        title: "Unit 1 – Hello",
        description: "Chào hỏi và giới thiệu bản thân.",
        lessons: [
          { id: "g3-u1-l1", title: "Greetings", objectives: "Chào hỏi và đáp lời chào.", durationMinutes: 60, materials: "Flashcards, audio", materialUrl: "", homework: "Luyện 5 mẫu câu chào hỏi." },
          { id: "g3-u1-l2", title: "Introducing myself", objectives: "Giới thiệu tên và thông tin cơ bản.", durationMinutes: 60, materials: "Student book", materialUrl: "", homework: "Viết 3 câu giới thiệu bản thân." },
        ],
      },
      {
        id: "g3-u2",
        title: "Unit 2 – My Family",
        description: "Từ vựng về các thành viên gia đình.",
        lessons: [
          { id: "g3-u2-l1", title: "Family members", objectives: "Gọi tên các thành viên trong gia đình.", durationMinutes: 60, materials: "Picture cards", materialUrl: "", homework: "Vẽ sơ đồ gia đình và ghi chú từ vựng." },
        ],
      },
    ],
    createdAt: "2026-10-01",
    updatedAt: "2026-10-01",
  },
  {
    id: "curriculum-flyers",
    code: "FLYERS-01",
    title: "English for Beginners – Supplementary Curriculum",
    description: "Giáo trình mẫu gắn với khóa English for Beginners. Có thể thay bằng Flyers hoặc IELTS khi trung tâm tạo các khóa tương ứng.",
    targetType: "course",
    grade: null,
    courseId: "english-beginner",
    status: "active",
    units: [
      {
        id: "fly-u1",
        title: "Listening & Speaking",
        description: "Luyện nghe hiểu và phản xạ nói.",
        lessons: [
          { id: "fly-u1-l1", title: "Listening for details", objectives: "Nghe và xác định thông tin chi tiết.", durationMinutes: 75, materials: "Audio practice", materialUrl: "", homework: "Hoàn thành bài nghe được giao." },
        ],
      },
    ],
    createdAt: "2026-10-02",
    updatedAt: "2026-10-02",
  },
];

type Store = typeof globalThis & { __ecCurricula?: Curriculum[] };
const store = globalThis as Store;

function list(): Curriculum[] {
  if (!store.__ecCurricula) store.__ecCurricula = structuredClone(SEED_CURRICULA);
  return store.__ecCurricula;
}

export async function getCurricula(): Promise<Curriculum[]> {
  return list().map((item) => structuredClone(item));
}

export async function getCurriculumById(id: string): Promise<Curriculum | undefined> {
  const item = list().find((curriculum) => curriculum.id === id);
  return item ? structuredClone(item) : undefined;
}

export async function createCurriculum(input: CurriculumInput): Promise<Curriculum> {
  const slug = input.code.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const now = new Date().toISOString().slice(0, 10);
  const created: Curriculum = {
    ...structuredClone(input),
    version: 1,
    previousVersionId: null,
    id: `${slug}-${Date.now().toString(36)}`,
    code: input.code.trim().toUpperCase(),
    title: input.title.trim(),
    createdAt: now,
    updatedAt: now,
  };
  list().push(created);
  return structuredClone(created);
}

export async function createCurriculumVersion(id: string, input: CurriculumInput): Promise<Curriculum | null> {
  const previous = list().find((item) => item.id === id);
  if (!previous) return null;
  const nextVersion = (previous.version ?? 1) + 1;
  // Giữ nguyên bản cũ để các lớp đã gán tiếp tục học theo đúng nội dung trước đây.
  previous.status = "inactive";
  previous.updatedAt = new Date().toISOString().slice(0, 10);
  const slug = input.code.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const now = new Date().toISOString().slice(0, 10);
  const created: Curriculum = {
    ...structuredClone(input),
    id: `${slug}-v${nextVersion}-${Date.now().toString(36)}`,
    code: input.code.trim().toUpperCase(),
    title: input.title.trim(),
    status: "active",
    version: nextVersion,
    previousVersionId: previous.id,
    createdAt: now,
    updatedAt: now,
  };
  list().push(created);
  return structuredClone(created);
}

export async function updateCurriculum(id: string, input: CurriculumInput): Promise<Curriculum | null> {
  const item = list().find((curriculum) => curriculum.id === id);
  if (!item) return null;
  Object.assign(item, structuredClone(input), {
    code: input.code.trim().toUpperCase(),
    title: input.title.trim(),
    updatedAt: new Date().toISOString().slice(0, 10),
  });
  return structuredClone(item);
}

export async function deleteCurriculum(id: string): Promise<boolean> {
  const index = list().findIndex((item) => item.id === id);
  if (index < 0) return false;
  list().splice(index, 1);
  return true;
}

export async function getCurriculumTargetLabel(item: Curriculum): Promise<string> {
  if (item.targetType === "grade") return `Khối ${item.grade}`;
  const courses = await getCourses();
  return courses.find((course) => course.id === item.courseId)?.name ?? "Khóa học không tồn tại";
}
