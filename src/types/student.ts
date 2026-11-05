export type StudentStatus = "active" | "inactive";
export type TuitionStatus = "paid" | "unpaid";

export interface Student {
  id: string;
  code: string; // mã học sinh, dùng làm tên đăng nhập
  fullName: string;
  className: string;
  parentName: string;
  parentPhone: string;
  dateOfBirth: string; // ISO yyyy-mm-dd
  enrolledDate: string; // ISO yyyy-mm-dd
  status: StudentStatus;
  averageScore: number;
  attendanceRate: number; // phần trăm
  tuitionStatus: TuitionStatus; // học phí tháng hiện tại
  /** Cho phép tài khoản học sinh truy cập chế độ Parent Portal (dùng chung tài khoản). */
  parentAccessEnabled: boolean;
}

export interface ClassOption {
  id: string;
  name: string;
}
