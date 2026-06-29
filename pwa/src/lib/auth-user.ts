/**
 * Resolve the signed-in user id from API / cache shapes (Mongo often uses _id only).
 */
export function getViewerId(
  user: { id?: string; _id?: string } | null | undefined,
): string | undefined {
  if (!user) return undefined;
  const raw = user.id ?? user._id;
  if (typeof raw === "string" && raw.length > 0) return raw;
  return undefined;
}
