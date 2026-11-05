export type CourseEnrollmentStatus = "active" | "completed" | "paused" | "cancelled";

/** Một học sinh đăng ký vào một lớp thuộc khóa học chuyên biệt. */
export interface CourseEnrollment {
  id: string;
  studentId: string;
  courseId: string;
  classId: string;
  enrolledAt: string;
  fee: number;
  status: CourseEnrollmentStatus;
  note: string;
}

export interface CourseEnrollmentInput {
  studentId: string;
  courseId: string;
  classId: string;
  enrolledAt: string;
  fee: number;
  note: string;
}

export interface CourseEnrollmentRow extends CourseEnrollment {
  studentName: string;
  studentCode: string;
  courseName: string;
  className: string;
}
