import type { UserRole } from "@/types/teacher";

/** Phiên đăng nhập minh họa cho giai đoạn frontend mock. Tài khoản có đồng thời Admin và Teacher. */
export const DEMO_CENTER_USER = {
  id: "demo-admin-teacher",
  username: "ADMIN01",
  roles: ["admin", "teacher"] as UserRole[],
  defaultRole: "admin" as UserRole,
  teacherId: "gv-001",
};

export function canAccessRole(role: UserRole): boolean {
  return DEMO_CENTER_USER.roles.includes(role);
}
