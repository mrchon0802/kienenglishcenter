import { formatScore, formatVND } from "@/lib/format";
import { addMonths, monthShort, toISODate } from "@/lib/month";
import type { DashboardData, TodoItem } from "@/types/dashboard";
import { getAssignmentStats, getAssignments, getEssayGradingItems } from "./assignments";
import { getClassSessions, getClassStudents, getClasses, getSessionById } from "./classes";
import { getGradebook } from "./gradebook";
import { getStudents } from "./students";
import { getDebtors, getInvoiceViews, getMonthSummaries } from "./tuition";

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-10-20T20:00" -> "20/10" */
function shortDate(dueAt: string): string {
  const [, month, day] = dueAt.split("T")[0].split("-");
  return `${day}/${month}`;
}

/**
 * Tổng hợp số liệu trang chủ admin từ các kho dữ liệu mẫu (học sinh, lớp, bài tập, học phí...).
 * Khi có backend: thay bằng một API dashboard, giữ nguyên kiểu DashboardData.
 * Cần gọi SAU `await connection()` vì phụ thuộc thời điểm hiện tại.
 */
export async function getDashboardData(now: Date): Promise<DashboardData> {
  const today = toISODate(now);
  const month = today.slice(0, 7);
  const dow = now.getDay();
  const vnDay = dow === 0 ? 8 : dow + 1;
  const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const [students, classes, assignments, invoices, gradebook, debtors] = await Promise.all([
    getStudents(),
    getClasses(),
    getAssignments(),
    getInvoiceViews(today),
    getGradebook(now),
    getDebtors(today),
  ]);
  const months = Array.from({ length: 6 }, (_, i) => addMonths(month, i - 5));
  const summaries = await getMonthSummaries(months, today);
  const thisMonth = summaries[summaries.length - 1];
  const classNameById = new Map(classes.map((c) => [c.id, c.name]));

  // ---- Việc cần xử lý
  const pendingEssay: { id: string; title: string; count: number }[] = [];
  for (const a of assignments) {
    const items = await getEssayGradingItems(a);
    const waiting = items.filter((i) => i.grade === null).length;
    if (waiting > 0) pendingEssay.push({ id: a.id, title: a.title, count: waiting });
  }
  const essayTotal = pendingEssay.reduce((s, p) => s + p.count, 0);

  const testsDueToday = assignments.filter((a) => a.kind === "test" && a.dueAt.startsWith(today));
  const overdueInvoices = invoices.filter((v) => v.status === "overdue").length;

  let absentStreak = 0; // học sinh vắng 3 buổi liên tiếp gần nhất
  for (const cls of classes) {
    const sessions = (await getClassSessions(cls.id)).filter((s) => s.summary).slice(0, 3);
    if (sessions.length < 3) continue;
    const records = await Promise.all(sessions.map((s) => getSessionById(cls.id, s.id)));
    const members = await getClassStudents(cls.id);
    absentStreak += members.filter((m) => records.every((r) => r?.record[m.id] === "absent")).length;
  }

  const todos: TodoItem[] = [
    {
      id: "essay",
      count: essayTotal,
      text: pendingEssay.length === 1 ? `bài tự luận chờ chấm (${pendingEssay[0].title})` : `bài tự luận chờ chấm (${pendingEssay.length} bài tập)`,
      actionLabel: "Chấm bài",
      href: pendingEssay.length === 1 ? `/admin/assignments/${pendingEssay[0].id}/grade` : "/admin/assignments",
    },
    {
      id: "due-today",
      count: testsDueToday.length,
      text: "bài kiểm tra hết hạn nộp hôm nay",
      actionLabel: "Xem bài nộp",
      href: testsDueToday.length === 1 ? `/admin/assignments/${testsDueToday[0].id}` : "/admin/assignments",
    },
    { id: "overdue", count: overdueInvoices, text: "hóa đơn quá hạn chưa thanh toán", actionLabel: "Xem công nợ", href: "/admin/tuition/debts" },
    { id: "absent", count: absentStreak, text: "học sinh vắng 3 buổi liên tiếp", actionLabel: "Xem danh sách", href: "/admin/classes" },
  ].filter((t) => t.count > 0);

  // ---- Lịch dạy hôm nay
  const todayClasses = classes
    .filter((c) => c.scheduleDays.includes(vnDay))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const nextId = todayClasses.find((c) => c.endTime > clock)?.id;
  const schedule = await Promise.all(
    todayClasses.map(async (c) => {
      const sessions = await getClassSessions(c.id);
      return {
        id: c.id,
        time: `${c.startTime} - ${c.endTime}`,
        className: `Lớp ${c.name}`,
        detail: `Unit ${c.currentUnit} · ${c.studentCount} học sinh`,
        attendanceHref: sessions[0] ? `/admin/classes/${c.id}/attendance/${sessions[0].id}` : `/admin/classes/${c.id}`,
        isNext: c.id === nextId,
      };
    }),
  );

  // ---- Bài tập gần đây (theo hạn nộp mới nhất)
  const recent = [...assignments].sort((a, b) => b.dueAt.localeCompare(a.dueAt)).slice(0, 4);
  const recentAssignments = await Promise.all(
    recent.map(async (a) => {
      const stats = await getAssignmentStats(a, now);
      return {
        id: a.id,
        title: a.title,
        className: classNameById.get(a.classId) ?? a.classId,
        kind: a.kind,
        dueDate: shortDate(a.dueAt),
        submitted: stats.submitted,
        total: stats.total,
        averageScore: stats.averageScore,
      };
    }),
  );

  // ---- Điểm trung bình bài kiểm tra theo lớp
  const classScores = gradebook
    .filter((g) => g.classTestAverage !== null)
    .map((g) => ({ className: g.name, averageScore: Math.round((g.classTestAverage ?? 0) * 10) / 10 }))
    .sort((a, b) => b.averageScore - a.averageScore);

  // ---- Học sinh cần chú ý: nợ quá hạn, chưa nộp bài kiểm tra, điểm TB dưới 7
  const flagged = new Map<string, { name: string; className: string; reasons: string[] }>();
  const flag = (id: string, name: string, className: string, reason: string) => {
    const entry = flagged.get(id) ?? { name, className, reasons: [] };
    entry.reasons.push(reason);
    flagged.set(id, entry);
  };
  for (const d of debtors.filter((x) => x.overdueAmount > 0)) {
    flag(d.studentId, d.studentName, d.className, `Nợ học phí ${d.invoiceCount} tháng (${formatVND(d.totalOwed)})`);
  }
  for (const g of gradebook) {
    for (const row of g.rows) {
      const missed = g.assignments.filter((a) => row.cells[a.id]?.status === "missed");
      if (missed.length > 0) flag(row.studentId, row.studentName, g.name, `Chưa nộp ${missed.length} bài kiểm tra`);
      if (row.testAverage !== null && row.testAverage < 7) {
        flag(row.studentId, row.studentName, g.name, `Điểm TB kiểm tra ${formatScore(row.testAverage)}`);
      }
    }
  }
  const attention = [...flagged.entries()]
    .sort(([, a], [, b]) => b.reasons.length - a.reasons.length || a.name.localeCompare(b.name, "vi"))
    .slice(0, 4)
    .map(([id, v]) => ({
      id,
      name: v.name,
      className: `Lớp ${v.className}`,
      reason: v.reasons.join(" · "),
      href: `/admin/reports/students/${id}`,
    }));

  const activeStudents = students.filter((s) => s.status === "active");

  return {
    isMock: true,
    summary: {
      studentCount: activeStudents.length,
      classCount: classes.length,
      classesToday: todayClasses.length,
      monthLabel: `tháng ${Number(month.split("-")[1])}`,
      monthRevenue: thisMonth.collected,
      paidInvoices: invoices.filter((v) => v.month === month && v.remaining === 0).length,
      totalInvoices: invoices.filter((v) => v.month === month).length,
      debtAmount: debtors.reduce((s, d) => s + d.totalOwed, 0),
      debtStudentCount: debtors.length,
    },
    todos,
    schedule,
    recentAssignments,
    classScores,
    attention,
    revenue: summaries.map((s) => ({ month: monthShort(s.month), valueInMillions: Math.round(s.collected / 100_000) / 10 })),
  };
}
