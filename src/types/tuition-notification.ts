export type TuitionNoticeAudience = "admin" | "teacher";
export type TuitionNoticeKind = "reminder" | "due" | "overdue" | "payment" | "agreement";
export interface TuitionNotice {
  id: string;
  audience: TuitionNoticeAudience;
  recipientId: string;
  studentId: string;
  invoiceId: string;
  classId: string;
  title: string;
  message: string;
  kind: TuitionNoticeKind;
  createdAt: string;
  sourceId: string;
}
