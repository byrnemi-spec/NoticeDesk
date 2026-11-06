import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    firmId: string;
    role: "admin" | "staff";
  }
  interface Session {
    user: { id: string; firmId: string; role: "admin" | "staff" } & DefaultSession["user"];
  }
}
