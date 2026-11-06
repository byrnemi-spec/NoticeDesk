"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = { error: string; email: string } | null;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const from = String(formData.get("from") ?? "/");
  // Only allow relative redirects back into the app.
  const redirectTo = from.startsWith("/") && !from.startsWith("//") ? from : "/";
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo,
    });
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      // Return the email so the form keeps it after React resets the inputs.
      return { error: "Invalid email or password.", email: String(formData.get("email") ?? "") };
    }
    throw error; // lets the success redirect through
  }
}
