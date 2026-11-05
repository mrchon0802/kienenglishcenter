export type StudentNotificationCategory = "assignment" | "tuition" | "schedule" | "general";
export interface StudentNotification {
  id: string;
  studentId: string;
  title: string;
  message: string;
  href: string;
  createdAt: string;
  readAt: string | null;
  /** Giữ lại để tương thích dữ liệu thông báo bài tập cũ. */
  assignmentId: string;
  category?: StudentNotificationCategory;
  sourceId?: string;
}
