"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type DeletePollButtonProps = {
  pollId: string;
  pollTitle: string;
};

export default function DeletePollButton({ pollId, pollTitle }: DeletePollButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleDelete() {
    if (!confirm(`Delete "${pollTitle}"? This cannot be undone.`)) return;

    setIsDeleting(true);

    try {
      const { data: dates } = await supabase
        .from("user_poll_dates")
        .select("id")
        .eq("poll_id", pollId);

      const dateIds = (dates ?? []).map((d: { id: string }) => d.id);

      if (dateIds.length > 0) {
        const { error: votesError } = await supabase
          .from("user_votes")
          .delete()
          .in("poll_date_id", dateIds);
        if (votesError) throw new Error(votesError.message);
      }

      const { error: datesError } = await supabase
        .from("user_poll_dates")
        .delete()
        .eq("poll_id", pollId);
      if (datesError) throw new Error(datesError.message);

      const { error: pollError } = await supabase
        .from("user_polls")
        .delete()
        .eq("id", pollId);
      if (pollError) throw new Error(pollError.message);

      router.refresh();
    } catch (err) {
      alert(`Delete failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      setIsDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-sm text-red-500 hover:text-red-400 transition disabled:opacity-50"
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}
