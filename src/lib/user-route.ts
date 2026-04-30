import type { IUserParams } from "@/store/auth.store";

export function getDefaultRouteForUser(
  user: Pick<IUserParams, "role"> | null | undefined,
) {
  if (!user) {
    return "/";
  }

  if (["ORGANIZER", "ADMIN"].includes(user.role)) {
    return "/dashboard";
  }

  return "/profile";
}
