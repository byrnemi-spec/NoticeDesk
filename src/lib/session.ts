import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Returns the logged-in user (id, firmId, role) or redirects to /login.
 * Use in every server page/action and filter all queries by `user.firmId`.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id || !session.user.firmId) redirect("/login");
  return session.user;
}
