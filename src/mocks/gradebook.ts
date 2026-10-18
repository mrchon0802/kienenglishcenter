import { buildResult } from "@/lib/grading";
import type { GradebookCell, GradebookClass, GradebookRow } from "@/types/gradebook";
import { getAssignments, getAttempts } from "./assignments";
import { getClassStudents, getClasses } from "./classes";

function mean(values: number[]): number | null {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

/** Bảng điểm theo lớp. Điểm chính thức = bài kiểm tra; bài luyện tập chỉ để theo dõi tiến độ. */
export async function getGradebook(now: Date): Promise<GradebookClass[]> {
  const [classes, assignments] = await Promise.all([getClasses(), getAssignments()]);
  const output: GradebookClass[] = [];

  for (const cls of classes) {
    const list = assignments
      .filter((a) => a.classId === cls.id)
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    const students = await getClassStudents(cls.id);
    const attemptsByAssignment = new Map<string, Awaited<ReturnType<typeof getAttempts>>>();
    for (const a of list) attemptsByAssignment.set(a.id, await getAttempts(a.id));

    const rows: GradebookRow[] = students.map((student) => {
      const cells: Record<string, GradebookCell> = {};
      const testScores: number[] = [];

      for (const a of list) {
        const mine = (attemptsByAssignment.get(a.id) ?? []).filter((at) => at.studentId === student.id);
        if (mine.length === 0) {
          const missed = a.kind === "test" && now.getTime() > new Date(a.dueAt).getTime();
          cells[a.id] = { status: missed ? "missed" : "none", score: null };
          continue;
        }
        const results = mine.map((at) => buildResult(a, at, now));
        const best = Math.max(...results.map((r) => r.score));
        cells[a.id] = { status: results.some((r) => r.pendingManual) ? "pending" : "graded", score: best };
        if (a.kind === "test") testScores.push(best);
      }
      return { studentId: student.id, studentName: student.fullName, cells, testAverage: mean(testScores) };
    });

    output.push({
      id: cls.id,
      name: cls.name,
      assignments: list.map((a) => ({ id: a.id, title: a.title, kind: a.kind, dueAt: a.dueAt })),
      rows,
      classTestAverage: mean(rows.map((r) => r.testAverage).filter((v): v is number => v !== null)),
    });
  }
  return output;
}
