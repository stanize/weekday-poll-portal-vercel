"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { formatDay } from "@/lib/monthGrid";

type HeavyPoll = { id: string; title: string; start_date: string; end_date: string };

const SLUG = "heavy-games-poll";
const MAX_DAYS = 92;

function dayCount(start: string, end: string) {
  return Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
}

export default function HeavyGamesAdmin({ poll, voteCount }: { poll: HeavyPoll | null; voteCount: number }) {
  const router = useRouter();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function show(text: string, error = false) {
    setMessage(text);
    setIsError(error);
  }

  async function launch(e: React.FormEvent) {
    e.preventDefault();
    if (!start || !end) return show("Pick a start and end date.", true);
    if (end < start) return show("End date must be on or after the start date.", true);
    if (dayCount(start, end) > MAX_DAYS) return show(`Keep the range to ${MAX_DAYS} days or fewer.`, true);

    if (
      poll &&
      !confirm(
        `A poll is already running (${formatDay(poll.start_date)} – ${formatDay(poll.end_date)}, ${voteCount} vote${voteCount === 1 ? "" : "s"}). Launching a new one DELETES it and all its votes. Continue?`
      )
    ) {
      return;
    }

    setBusy(true);
    show("");
    try {
      if (poll) {
        // heavy_votes rows go with it (on delete cascade)
        const { error } = await supabase.from("heavy_polls").delete().eq("id", poll.id);
        if (error) throw new Error(`Error deleting existing poll: ${error.message}`);
      }
      const { error } = await supabase
        .from("heavy_polls")
        .insert({ slug: SLUG, title: "Heavy Games Poll", start_date: start, end_date: end });
      if (error) throw new Error(`Error creating poll: ${error.message}`);

      show(`Poll launched for ${formatDay(start)} – ${formatDay(end)}.`);
      setStart("");
      setEnd("");
      router.refresh();
    } catch (err) {
      show(err instanceof Error ? err.message : "Something went wrong.", true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border rounded-xl p-6 space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Current poll</h2>
        {poll ? (
          <>
            <p className="text-sm text-gray-300">
              {formatDay(poll.start_date)} – {formatDay(poll.end_date)} · {voteCount} vote{voteCount === 1 ? "" : "s"}
            </p>
            <a href={`/${SLUG}`} className="text-sm underline text-gray-400" target="_blank" rel="noreferrer">
              /{SLUG}
            </a>
          </>
        ) : (
          <p className="text-sm text-gray-400">No poll is running.</p>
        )}
      </div>

      <hr className="border-gray-700" />

      <form onSubmit={launch} className="space-y-3">
        <h2 className="text-xl font-semibold">{poll ? "Replace poll" : "Launch poll"}</h2>
        <p className="text-sm text-gray-400">
          Voters get a month grid covering these dates.
          {poll && " Launching a new poll deletes the current one and its votes (you'll be asked to confirm)."}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-sm font-medium">
            Start date
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 bg-transparent"
            />
          </label>
          <label className="space-y-1 text-sm font-medium">
            End date
            <input
              type="date"
              value={end}
              min={start || undefined}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 bg-transparent"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={busy}
          className={`rounded-lg border px-4 py-2 font-medium transition disabled:opacity-50 ${
            poll ? "border-red-500 text-red-500 hover:bg-red-500 hover:text-black" : "hover:bg-[var(--foreground)] hover:text-[var(--background)]"
          }`}
        >
          {busy ? "Working..." : poll ? "Replace poll" : "Launch poll"}
        </button>
      </form>

      {message && <p className={`text-sm ${isError ? "text-red-400" : "text-green-400"}`}>{message}</p>}
    </div>
  );
}
