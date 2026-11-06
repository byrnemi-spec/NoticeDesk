import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Protects every route except /login, Auth.js endpoints, and static assets.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
