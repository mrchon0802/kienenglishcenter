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
const students: Student[] = Array.from({ length: 24 }, (_, i) => {
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
  };
});

// Giữ chữ ký async để sau này thay bằng gọi API thật.
export async function getStudents(): Promise<Student[]> {
  return students;
}

export async function getStudentById(id: string): Promise<Student | undefined> {
  return students.find((s) => s.id === id);
}

export async function getClassOptions(): Promise<ClassOption[]> {
  return CLASS_NAMES.map((name) => ({ id: name, name }));
}
