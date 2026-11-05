import type { ClassOption, Student } from "@/types/student";

const CLASS_NAMES = ["1A", "3A", "4A", "6B", "9A"];
const FAMILY = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Võ", "Đặng", "Bùi"];
const MIDDLE = ["Minh", "Gia", "Bảo", "Khánh", "Ngọc", "Thanh", "Anh", "Hải"];
const GIVEN = ["An", "Châu", "Huy", "Linh", "Nam", "Vy", "Khoa", "Mai", "Phúc", "Trang", "Đạt", "Lan"];
const PARENT_GIVEN = ["Hà", "Dũng", "Hương", "Tuấn", "Thảo", "Long"];

function pad(n: number, size = 2): string {
  return String(n).padStart(size, "0");
}

// Sinh 24 học sinh mẫu cố định (không dùng random để server và client luôn khớp nhau).
function seedStudents(): Student[] {
  return Array.from({ length: 24 }, (_, i) => {
    const family = FAMILY[i % 8];
    return {
      id: `hs-${pad(i + 1, 3)}`,
      code: `HS${pad(i + 1, 3)}`,
      fullName: `${family} ${MIDDLE[(i * 3) % 8]} ${GIVEN[(i * 5) % 12]}`,
      className: CLASS_NAMES[i % 5],
      parentName: `${family} ${PARENT_GIVEN[i % 6]}`,
      parentPhone: `09${String(12345678 + i * 91357).slice(0, 8)}`,
      dateOfBirth: `201${i % 8}-${pad(1 + (i % 9))}-15`,
      enrolledDate: `2025-${pad(1 + (i % 12))}-${pad(1 + ((i * 3) % 27))}`,
      status: i % 9 === 8 ? "inactive" : "active",
      averageScore: Number((6 + ((i * 37) % 40) / 10).toFixed(1)),
      attendanceRate: 80 + ((i * 7) % 21),
      tuitionStatus: i % 4 === 3 ? "unpaid" : "paid",
      parentAccessEnabled: false,
    } satisfies Student;
  });
}

// Kho học sinh trong bộ nhớ server (globalThis), mất khi khởi động lại. Backend thật sẽ thay thế.
const g = globalThis as unknown as { __ecStudents?: Student[] };
function list(): Student[] {
  if (!g.__ecStudents) g.__ecStudents = seedStudents();
  return g.__ecStudents;
}

export async function getStudents(): Promise<Student[]> {
  return list();
}

export async function getStudentById(id: string): Promise<Student | undefined> {
  return list().find((s) => s.id === id);
}

/** Danh sách lớp hiện có (lấy từ kho lớp để lớp mới tạo cũng xuất hiện). */
export async function getClassOptions(): Promise<ClassOption[]> {
  const { getClasses } = await import("./classes");
  return (await getClasses()).map((c) => ({ id: c.id, name: c.name }));
}

export interface NewStudentData {
  fullName: string;
  className: string;
  parentName: string;
  parentPhone: string; // đã chuẩn hóa 10 chữ số
  dateOfBirth: string; // "" nếu không có
  enrolledDate: string; // "yyyy-mm-dd"
}

/**
 * Tạo học sinh mới. Các trường averageScore, attendanceRate, tuitionStatus trên Student là số liệu mẫu cũ:
 * học sinh mới để averageScore = 0 (nghĩa là "chưa có điểm"). Số liệu thật tính từ bảng điểm, điểm danh, học phí.
 */
export async function createStudents(inputs: NewStudentData[]): Promise<Student[]> {
  const all = list();
  let next = Math.max(0, ...all.map((s) => Number.parseInt(s.id.replace(/\D/g, ""), 10))) + 1;
  const created: Student[] = inputs.map((input) => {
    const number = next;
    next += 1;
    return {
      id: `hs-${pad(number, 3)}`,
      code: `HS${pad(number, 3)}`,
      fullName: input.fullName,
      className: input.className,
      parentName: input.parentName,
      parentPhone: input.parentPhone,
      dateOfBirth: input.dateOfBirth,
      enrolledDate: input.enrolledDate,
      status: "active",
      averageScore: 0,
      attendanceRate: 100,
      tuitionStatus: "unpaid",
      parentAccessEnabled: false,
    } satisfies Student;
  });
  all.push(...created);
  return created;
}

export type StudentPatch = Partial<
  Pick<Student, "fullName" | "className" | "parentName" | "parentPhone" | "dateOfBirth" | "status" | "parentAccessEnabled">
>;

export async function updateStudent(id: string, patch: StudentPatch): Promise<Student | null> {
  const student = list().find((s) => s.id === id);
  if (!student) return null;
  Object.assign(student, patch);
  return student;
}
