export type TeacherAccountStatus = "pending_activation" | "active" | "locked";
export type TeacherEmploymentStatus = "working" | "inactive";
export type UserRole = "admin" | "teacher" | "student";

/** Tài khoản dùng chung cho các vai trò; giai đoạn mock chưa có thông tin xác thực. */
export interface CenterUser {
  id: string;
  username: string;
  email: string;
  roles: UserRole[];
  status: TeacherAccountStatus;
  createdAt: string;
  activatedAt?: string;
  statusBeforeLock?: TeacherAccountStatus;
}

export interface Teacher {
  id: string;
  userId: string;
  teacherCode: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  specialization?: string;
  qualification?: string;
  certificates: string[];
  startDate: string;
  employmentStatus: TeacherEmploymentStatus;
  note?: string;
}

export interface TeacherInput {
  fullName: string;
  phoneNumber: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  specialization: string;
  qualification: string;
  certificates: string;
  startDate: string;
  employmentStatus: TeacherEmploymentStatus;
  note: string;
}
