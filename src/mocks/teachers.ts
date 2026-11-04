import type { CenterUser, Teacher, TeacherAccountStatus, TeacherInput } from "@/types/teacher";

interface TeacherStore { teachers: Teacher[]; users: CenterUser[] }
const g = globalThis as typeof globalThis & { __ecTeacherStore?: TeacherStore };

const SEED_TEACHERS: Teacher[] = [
  { id: "gv-001", userId: "user-001", teacherCode: "GV001", fullName: "Nguyễn Thị Minh Anh", phoneNumber: "0901234567", email: "minhanh@example.com", specialization: "Tiếng Anh thiếu nhi", qualification: "Cử nhân Ngôn ngữ Anh", certificates: ["TESOL"], startDate: "2023-08-01", employmentStatus: "working" },
  { id: "gv-002", userId: "user-002", teacherCode: "GV002", fullName: "Trần Quốc Bảo", phoneNumber: "0912345678", email: "quocbao@example.com", specialization: "Ngữ pháp & Cambridge", qualification: "Cử nhân Sư phạm Anh", certificates: ["TESOL", "TKT"], startDate: "2024-01-15", employmentStatus: "working" },
  { id: "gv-003", userId: "user-003", teacherCode: "GV003", fullName: "Lê Hoàng Yến", phoneNumber: "0923456789", email: "hoangyen@example.com", specialization: "Tiếng Anh THCS", qualification: "Cử nhân Ngôn ngữ Anh", certificates: ["IELTS 7.5"], startDate: "2024-06-01", employmentStatus: "working" },
  { id: "gv-004", userId: "user-004", teacherCode: "GV004", fullName: "Phạm Đức Huy", phoneNumber: "0934567890", email: "duchuy@example.com", specialization: "Luyện thi & giao tiếp", qualification: "Cử nhân Sư phạm Anh", certificates: ["TESOL"], startDate: "2025-02-10", employmentStatus: "working" },
  { id: "gv-005", userId: "user-005", teacherCode: "GV005", fullName: "Võ Ngọc Hà", phoneNumber: "0945678901", email: "ngocha@example.com", specialization: "Cambridge Young Learners", qualification: "Cử nhân Ngôn ngữ Anh", certificates: ["TKT"], startDate: "2025-08-01", employmentStatus: "working" },
];

function store(): TeacherStore {
  if (!g.__ecTeacherStore) {
    const teachers = structuredClone(SEED_TEACHERS);
    g.__ecTeacherStore = {
      teachers,
      users: teachers.map((teacher) => ({ id: teacher.userId, username: teacher.teacherCode, email: teacher.email, roles: ["teacher"], status: "active", createdAt: teacher.startDate, activatedAt: teacher.startDate })),
    };
  }
  return g.__ecTeacherStore;
}
function pad(value: number) { return String(value).padStart(3, "0"); }

export async function getTeachers(): Promise<Teacher[]> {
  return [...store().teachers].sort((a, b) => a.teacherCode.localeCompare(b.teacherCode));
}
export async function getTeacherById(id: string): Promise<Teacher | undefined> {
  return store().teachers.find((teacher) => teacher.id === id);
}
export async function getTeacherAccount(id: string): Promise<CenterUser | undefined> {
  const teacher = await getTeacherById(id);
  return teacher ? store().users.find((user) => user.id === teacher.userId) : undefined;
}
export async function createTeacher(input: TeacherInput): Promise<Teacher> {
  const data = store();
  const next = Math.max(0, ...data.teachers.map((item) => Number(item.teacherCode.slice(2)) || 0)) + 1;
  const teacherCode = `GV${pad(next)}`;
  const id = `gv-${pad(next)}`;
  const userId = `user-${pad(next)}`;
  const user: CenterUser = { id: userId, username: teacherCode, email: input.email.trim().toLowerCase(), roles: ["teacher"], status: "pending_activation", createdAt: new Date().toISOString() };
  const teacher: Teacher = {
    id, userId, teacherCode, fullName: input.fullName.trim().replace(/\s+/g, " "), phoneNumber: input.phoneNumber.trim(), email: user.email,
    dateOfBirth: input.dateOfBirth, gender: input.gender, address: input.address.trim(), specialization: input.specialization.trim(),
    qualification: input.qualification.trim(), certificates: input.certificates.split(/[\,\n]/).map((v) => v.trim()).filter(Boolean),
    startDate: input.startDate, employmentStatus: input.employmentStatus, note: input.note.trim(),
  };
  data.users.push(user); data.teachers.push(teacher); return teacher;
}
export async function updateTeacher(id: string, input: TeacherInput): Promise<Teacher | null> {
  const data = store(); const teacher = data.teachers.find((item) => item.id === id); if (!teacher) return null;
  Object.assign(teacher, { fullName: input.fullName.trim().replace(/\s+/g, " "), phoneNumber: input.phoneNumber.trim(), email: input.email.trim().toLowerCase(), dateOfBirth: input.dateOfBirth, gender: input.gender, address: input.address.trim(), specialization: input.specialization.trim(), qualification: input.qualification.trim(), certificates: input.certificates.split(/[\,\n]/).map((v) => v.trim()).filter(Boolean), startDate: input.startDate, employmentStatus: input.employmentStatus, note: input.note.trim() });
  const user = data.users.find((item) => item.id === teacher.userId); if (user) user.email = teacher.email; return teacher;
}
export async function setTeacherAccountStatus(id: string, status: TeacherAccountStatus): Promise<boolean> {
  const teacher = await getTeacherById(id); if (!teacher) return false;
  const user = store().users.find((item) => item.id === teacher.userId); if (!user) return false;
  if (status === "locked") { if (user.status !== "locked") user.statusBeforeLock = user.status; user.status = "locked"; }
  else if (status === "active") { user.status = user.statusBeforeLock ?? (user.activatedAt ? "active" : "pending_activation"); delete user.statusBeforeLock; }
  else user.status = status;
  return true;
}
