import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { getTeachers, getTeacherAccount } from "@/mocks/teachers";
import { getTeacherAssignmentHistory, getTeacherAssignmentOverview } from "@/mocks/teacher-assignments";
import { AssignmentManager } from "../AssignmentManager";
export const metadata: Metadata = { title: "Phân công giáo viên | Quản trị" };
export default async function TeacherAssignmentsPage() {
  const [classes, teachers, history] = await Promise.all([getTeacherAssignmentOverview(), getTeachers(), getTeacherAssignmentHistory()]);
  const available = await Promise.all(teachers.map(async (teacher) => ({ teacher, account: await getTeacherAccount(teacher.id) })));
  const options = available.filter(({teacher,account}) => teacher.employmentStatus === "working" && account?.status === "active").map(({teacher}) => ({id:teacher.id,teacherCode:teacher.teacherCode,fullName:teacher.fullName}));
  const historyRows = history.map((item) => ({id:item.id,teacherId:item.teacherId,classId:item.classId,startDate:item.startDate,endDate:item.endDate,reason:item.reason,teacherName:item.teacher?.fullName??"Không rõ",teacherCode:item.teacher?.teacherCode??"—",className:item.classInfo?.name??item.classId}));
  return <><PageHeader title="Phân công giáo viên" subtitle="Quản lý giáo viên phụ trách từng lớp và theo dõi lịch sử thay đổi."/><AssignmentManager classes={classes} teachers={options} history={historyRows}/></>;
}
