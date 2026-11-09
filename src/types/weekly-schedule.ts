export type WeeklyScheduleStatus = "draft" | "published";
export type WeeklySessionStatus = "scheduled" | "cancelled";
export type WeeklySessionType = "regular" | "makeup";

export interface WeeklyClassSession {
  id: string;
  classId: string;
  date: string;
  startTime: string;
  endTime: string;
  teacherIds: string[];
  status: WeeklySessionStatus;
  type: WeeklySessionType;
  originalSessionId?: string;
  source: "fixed" | "copied" | "manual";
  changeReason?: string;
}

export interface WeeklySchedule {
  weekStart: string;
  status: WeeklyScheduleStatus;
  sessions: WeeklyClassSession[];
  updatedAt: string;
  updatedBy: string;
}

export interface ScheduleAuditLog {
  id: string;
  weekStart: string;
  sessionId: string;
  classId: string;
  action: "updated" | "cancelled" | "makeup_created" | "published" | "reopened";
  actor: string;
  at: string;
  reason: string;
  before?: Partial<WeeklyClassSession>;
  after?: Partial<WeeklyClassSession>;
}
