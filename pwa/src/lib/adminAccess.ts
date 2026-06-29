import type { User } from "@/types/api";

/** True when the user has platform admin access (Safety Operator, moderators with admin role, etc.). */
export function isAdminUser(
  user: Pick<User, "role" | "isAdmin"> | null | undefined,
): boolean {
  if (!user) return false;
  if (user.isAdmin === true) return true;
  const role = user.role?.toLowerCase?.() ?? user.role;
  return role === "admin" || role === "super_admin";
}
