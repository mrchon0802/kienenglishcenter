import type { StudentAssessment, StudentAssessmentInput } from "@/types/student-assessment";
import { getStudentById } from "@/mocks/students";
import { getClassById } from "@/mocks/classes";
import { getTeacherAssignments } from "@/mocks/teacher-assignments";

type Store = typeof globalThis & { __ecStudentAssessments?: StudentAssessment[] };
const root = globalThis as Store;
function records(): StudentAssessment[] {
  if (!root.__ecStudentAssessments) root.__ecStudentAssessments = [];
  return root.__ecStudentAssessments;
}

export async function getStudentAssessments(): Promise<StudentAssessment[]> {
  return [...records()].sort((a, b) => b.assessedAt.localeCompare(a.assessedAt) || b.createdAt.localeCompare(a.createdAt));
}

export async function getAssessmentsForStudent(studentId: string): Promise<StudentAssessment[]> {
  return (await getStudentAssessments()).filter((item) => item.studentId === studentId);
}

export async function createStudentAssessment(
  teacherId: string,
  input: StudentAssessmentInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const [student, cls, assignments] = await Promise.all([
    getStudentById(input.studentId),
    getClassById(input.classId),
    getTeacherAssignments(),
  ]);
  if (!student || student.status !== "active") return { ok: false, error: "Không tìm thấy học sinh đang hoạt động." };
  if (!cls || student.className !== cls.name) return { ok: false, error: "Học sinh không thuộc lớp đã chọn." };
  if (!assignments.some((item) => item.teacherId === teacherId && item.classId === input.classId && !item.endDate)) {
    return { ok: false, error: "Bạn không được phân công phụ trách lớp này." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.assessedAt)) return { ok: false, error: "Ngày đánh giá không hợp lệ." };
  const values = Object.values(input.scores);
  if (values.length !== 4 || values.some((score) => !Number.isFinite(score) || score < 0 || score > 10)) {
    return { ok: false, error: "Điểm 4 kỹ năng phải nằm trong khoảng 0–10." };
  }
  if (!input.strengths.trim() || !input.improvements.trim()) return { ok: false, error: "Vui lòng nhập điểm mạnh và nội dung cần cải thiện." };
  const id = `assessment-${Date.now().toString(36)}-${records().length + 1}`;
  records().unshift({
    ...input,
    id,
    studentName: student.fullName,
    studentCode: student.code,
    className: cls.name,
    teacherId,
    createdAt: new Date().toISOString(),
  });
  return { ok: true, id };
}
