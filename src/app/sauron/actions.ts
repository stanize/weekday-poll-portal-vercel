"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE,
  checkCredentials,
  createSessionToken,
} from "@/lib/adminAuth";

export async function login(_prev: string | null, formData: FormData) {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!checkCredentials(username, password)) return "Invalid username or password.";

  (await cookies()).set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/sauron",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/sauron");
}

export async function logout() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/sauron" });
  redirect("/sauron");
}
