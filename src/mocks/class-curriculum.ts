import type { Curriculum } from "@/types/curriculum";
import { getClassById, getClasses } from "@/mocks/classes";
import { getCurriculumById, getCurricula } from "@/mocks/curricula";

export interface ClassCurriculumLink {
  classId: string;
  curriculumId: string;
  assignedAt: string;
}

type Store = typeof globalThis & { __ecClassCurricula?: ClassCurriculumLink[] };
const root = globalThis as Store;

function links(): ClassCurriculumLink[] {
  if (!root.__ecClassCurricula) root.__ecClassCurricula = [];
  return root.__ecClassCurricula;
}

export async function getClassCurriculumLink(classId: string): Promise<ClassCurriculumLink | null> {
  const link = links().find((item) => item.classId === classId);
  return link ? { ...link } : null;
}

export async function getClassCurriculum(classId: string): Promise<Curriculum | null> {
  const link = await getClassCurriculumLink(classId);
  if (!link) return null;
  return (await getCurriculumById(link.curriculumId)) ?? null;
}

export async function assignCurriculumToClass(classId: string, curriculumId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const [cls, curriculum] = await Promise.all([getClassById(classId), getCurriculumById(curriculumId)]);
  if (!cls) return { ok: false, error: "Không tìm thấy lớp học." };
  if (!curriculum || curriculum.status !== "active") return { ok: false, error: "Giáo trình không tồn tại hoặc đang ngừng sử dụng." };
  if (curriculum.targetType === "grade" && curriculum.grade !== cls.grade) {
    return { ok: false, error: `Giáo trình này dành cho khối ${curriculum.grade}, không phù hợp với lớp ${cls.name}.` };
  }
  if (curriculum.targetType === "course" && curriculum.courseId !== cls.courseId) {
    return { ok: false, error: "Khóa học của giáo trình không khớp với khóa học được gán cho lớp." };
  }
  const existing = links().find((item) => item.classId === classId);
  if (existing) {
    existing.curriculumId = curriculumId;
    existing.assignedAt = new Date().toISOString();
  } else {
    links().push({ classId, curriculumId, assignedAt: new Date().toISOString() });
  }
  return { ok: true };
}

export async function getClassCurriculumAssignments() {
  const [classes, curricula] = await Promise.all([getClasses(), getCurricula()]);
  return links().flatMap((link) => {
    const cls = classes.find((item) => item.id === link.classId);
    const curriculum = curricula.find((item) => item.id === link.curriculumId);
    return cls && curriculum ? [{ ...link, className: cls.name, grade: cls.grade, curriculumTitle: curriculum.title, lessonCount: curriculum.units.reduce((sum, unit) => sum + unit.lessons.length, 0) }] : [];
  });
}
