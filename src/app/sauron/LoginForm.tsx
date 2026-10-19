"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginForm() {
  const [error, formAction, pending] = useActionState(login, null);

  return (
    <form action={formAction} className="border rounded-xl p-6 space-y-4">
      <input
        name="username"
        type="text"
        placeholder="Username"
        autoComplete="username"
        required
        className="w-full rounded-lg border px-3 py-2 bg-transparent"
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        required
        className="w-full rounded-lg border px-3 py-2 bg-transparent"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg border px-4 py-2 font-medium hover:bg-[var(--foreground)] hover:text-[var(--background)] transition disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
