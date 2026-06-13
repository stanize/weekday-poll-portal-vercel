"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type MagicLinkFormProps = {
  next: string; // the route to redirect to after auth e.g. "/create" or "/manage"
};

export default function MagicLinkForm({ next }: MagicLinkFormProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setError(error.message);
    } else {
      setSubmitted(true);
    }

    setIsSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="text-center space-y-2">
        <p className="text-lg font-medium">Check your email</p>
        <p className="text-sm text-gray-400">
          We sent a magic link to <span className="text-white">{email}</span>.
          Click it to continue.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium">
          Email address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 bg-transparent"
          placeholder="you@example.com"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg border px-4 py-2 font-medium hover:bg-white hover:text-black transition disabled:opacity-50"
      >
        {isSubmitting ? "Sending..." : "Send magic link"}
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
