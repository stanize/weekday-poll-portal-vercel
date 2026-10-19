"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { buildMonths, formatDay } from "@/lib/monthGrid";

type Props = {
  poll: { id: string; start_date: string; end_date: string };
  votes: { vote_date: string; voter_name: string }[];
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function HeavyGamesGrid({ poll, votes }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  // Days the user has toggled; null = untouched, fall back to their saved votes.
  const [picked, setPicked] = useState<string[] | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const months = useMemo(() => buildMonths(poll.start_date, poll.end_date), [poll]);

  const byDate = useMemo(() => {
    const map: Record<string, string[]> = {};
    votes.forEach((v) => (map[v.vote_date] ??= []).push(v.voter_name));
    return map;
  }, [votes]);
  const maxVotes = Math.max(0, ...Object.values(byDate).map((n) => n.length));

  const trimmed = name.trim();
  const saved = trimmed
    ? votes.filter((v) => v.voter_name.toLowerCase() === trimmed.toLowerCase()).map((v) => v.vote_date)
    : [];
  const selected = picked ?? saved;
  const isUpdating = saved.length > 0;

  function toggle(date: string) {
    setPicked((cur) => {
      const base = cur ?? saved;
      return base.includes(date) ? base.filter((d) => d !== date) : [...base, date];
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!trimmed) return setMessage("Please enter your name.");
    if (selected.length === 0) return setMessage("Please select at least one date.");

    setSubmitting(true);
    try {
      if (isUpdating) {
        const { error } = await supabase
          .from("heavy_votes")
          .delete()
          .eq("poll_id", poll.id)
          .ilike("voter_name", trimmed.replace(/[%_]/g, "\\$&"));
        if (error) throw new Error(error.message);
      }
      const { error } = await supabase
        .from("heavy_votes")
        .insert(selected.map((d) => ({ poll_id: poll.id, vote_date: d, voter_name: trimmed })));
      if (error) throw new Error(error.message);

      setMessage(isUpdating ? "Votes updated." : "Vote submitted.");
      setPicked(null);
      router.refresh();
    } catch (err) {
      setMessage(`Something went wrong: ${err instanceof Error ? err.message : "unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="voterName" className="block text-sm font-medium">Name (Required)</label>
        <input
          id="voterName"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setPicked(null);
          }}
          placeholder="Your name"
          className="w-full rounded-lg border px-3 py-2 bg-transparent"
        />
        {isUpdating && (
          <p className="text-sm text-yellow-400">Existing votes found — submitting will replace them.</p>
        )}
      </div>

      {months.map((month) => (
        <div key={month.key} className="space-y-2">
          <h2 className="text-lg font-semibold">{month.label}</h2>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
            {WEEKDAYS.map((w) => <div key={w}>{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {month.cells.map((date, i) => {
              if (!date) return <div key={`pad-${i}`} />;
              const inRange = date >= poll.start_date && date <= poll.end_date;
              const names = byDate[date] ?? [];
              const isSel = selected.includes(date);
              if (!inRange) {
                return (
                  <div key={date} className="aspect-square rounded-lg p-1 text-xs text-gray-700">
                    {Number(date.slice(8))}
                  </div>
                );
              }
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => toggle(date)}
                  aria-pressed={isSel}
                  title={names.length ? `${formatDay(date)}: ${names.join(", ")}` : formatDay(date)}
                  style={
                    !isSel && names.length
                      ? { backgroundColor: `rgba(34,197,94,${0.12 + 0.35 * (names.length / maxVotes)})` }
                      : undefined
                  }
                  className={`aspect-square rounded-lg border p-1 text-left flex flex-col justify-between transition cursor-pointer ${
                    isSel ? "bg-[var(--foreground)] text-[var(--background)]" : "hover:bg-[var(--foreground)]/10"
                  }`}
                >
                  <span className="text-sm font-medium">{Number(date.slice(8))}</span>
                  {names.length > 0 && <span className="text-xs opacity-80">{names.length}</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg border px-4 py-2 font-medium hover:bg-[var(--foreground)] hover:text-[var(--background)] transition disabled:opacity-50"
      >
        {submitting ? "Submitting..." : isUpdating ? "Update votes" : "Submit vote"}
      </button>
      {message && <p className="text-sm text-gray-300">{message}</p>}
      <p className="text-xs text-gray-500">Tap a day to mark it. Numbers show how many people can make it; hover a day to see who.</p>
    </form>
  );
}
