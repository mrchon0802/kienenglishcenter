export interface TeacherClassAssignment {
  id: string;
  teacherId: string;
  classId: string;
  startDate: string;
  endDate?: string;
  assignedBy: string;
  reason?: string;
}

export interface TeacherAssignmentRow {
  classId: string;
  className: string;
  grade: number;
  teacherId?: string;
  teacherName?: string;
  teacherCode?: string;
  startDate?: string;
}
