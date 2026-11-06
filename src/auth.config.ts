import type { NextAuthConfig } from "next-auth";

// Edge-safe config (no database / bcrypt) — used by middleware.
// The Credentials provider lives in src/auth.ts.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  // Required when self-hosting behind a proxy (Railway) and for `next start`.
  trustHost: true,
  providers: [],
  callbacks: {
    // Runs in middleware on every matched request.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = nextUrl.pathname === "/login";
      if (isLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      return isLoggedIn; // false → redirect to /login
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.firmId = user.firmId;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.firmId = token.firmId as string;
      session.user.role = token.role as "admin" | "staff";
      return session;
    },
  },
} satisfies NextAuthConfig;
