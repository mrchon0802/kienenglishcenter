import { getClasses, getClassSessions, getClassStudents } from "@/mocks/classes";
import { getTeacherById, getTeacherAccount } from "@/mocks/teachers";
import { getTeacherAssignments } from "@/mocks/teacher-assignments";

const DAY_LABELS: Record<number, string> = {
  2: "Thứ 2", 3: "Thứ 3", 4: "Thứ 4", 5: "Thứ 5", 6: "Thứ 6", 7: "Thứ 7", 8: "Chủ nhật",
};

export async function getTeacherPortalData(teacherId: string, now = new Date()) {
  const [teacher, account, classes, assignments] = await Promise.all([
    getTeacherById(teacherId), getTeacherAccount(teacherId), getClasses(), getTeacherAssignments(),
  ]);
  if (!teacher) return null;
  const currentAssignments = assignments.filter((item) => item.teacherId === teacherId && !item.endDate);
  const assignedClasses = await Promise.all(currentAssignments.map(async (assignment) => {
    const cls = classes.find((item) => item.id === assignment.classId);
    if (!cls) return null;
    const students = await getClassStudents(cls.id);
    const sessions = await getClassSessions(cls.id);
    return { ...cls, assignmentStartDate: assignment.startDate, students, recentSessions: sessions.slice(0, 3) };
  }));
  const validClasses = assignedClasses.filter((item): item is NonNullable<typeof item> => item !== null);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const schedule = validClasses.flatMap((cls) => {
    const entries: { classId: string; className: string; date: string; dayLabel: string; startTime: string; endTime: string; studentCount: number }[] = [];
    for (let offset = 0; offset < 7; offset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      const weekday = date.getDay() === 0 ? 8 : date.getDay() + 1;
      if (cls.scheduleDays.includes(weekday)) {
        entries.push({ classId: cls.id, className: cls.name, date: date.toISOString().slice(0, 10), dayLabel: DAY_LABELS[weekday], startTime: cls.startTime, endTime: cls.endTime, studentCount: cls.students.length });
      }
    }
    return entries;
  }).sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  return {
    teacher,
    account,
    classes: validClasses,
    schedule,
    stats: {
      classCount: validClasses.length,
      studentCount: validClasses.reduce((sum, item) => sum + item.students.length, 0),
      upcomingSessions: schedule.length,
    },
  };
}
