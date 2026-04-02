"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Poll = {
  id: string;
  title: string;
  description: string | null;
  slug: string;
};

function getUpcomingMondays(count = 4): Date[] {
  const mondays: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const day = today.getDay();
  const daysUntilMonday = day === 1 ? 0 : (8 - day) % 7;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);

  for (let i = 0; i < count; i++) {
    const monday = new Date(nextMonday);
    monday.setDate(nextMonday.getDate() + i * 7);
    mondays.push(monday);
  }
  return mondays;
}

function formatMonday(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getWeekdays(monday: Date): { weekday_name: string; poll_date: string }[] {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  return days.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return {
      weekday_name: name,
      poll_date: `${year}-${month}-${day}`,
    };
  });
}

export default function AdminPanel({ poll }: { poll: Poll | null }) {
  const router = useRouter();
  const mondays = getUpcomingMondays(4);
  const [selectedMonday, setSelectedMonday] = useState<Date>(mondays[0]);
  const [isResettingVotes, setIsResettingVotes] = useState(false);
  const [isResettingPoll, setIsResettingPoll] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  function showMessage(text: string, type: "success" | "error") {
    setMessage(text);
    setMessageType(type);
  }

  async function handleResetVotes() {
    if (!poll) return;
    if (!confirm("This will clear all votes but keep the poll dates. Are you sure?")) return;

    setIsResettingVotes(true);
    setMessage("");

    try {
      const { data: pollDates } = await supabase
        .from("poll_dates")
        .select("id")
        .eq("poll_id", poll.id);

      const pollDateIds = (pollDates ?? []).map((d) => d.id);

      if (pollDateIds.length > 0) {
        const { error } = await supabase
          .from("votes")
          .delete()
          .in("poll_date_id", pollDateIds);

        if (error) throw new Error(`Error clearing votes: ${error.message}`);
      }

      showMessage("Votes cleared successfully. Poll dates kept intact.", "success");
      router.refresh();
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Something went wrong.", "error");
    } finally {
      setIsResettingVotes(false);
    }
  }

  async function handleResetPoll() {
    if (!poll) return;
    if (!confirm(`This will clear all votes & dates, then create a new week starting ${formatMonday(selectedMonday)}. Are you sure?`)) return;

    setIsResettingPoll(true);
    setMessage("");

    try {
      // Fetch existing dates
      const { data: existingDates } = await supabase
        .from("poll_dates")
        .select("id")
        .eq("poll_id", poll.id);

      const existingIds = (existingDates ?? []).map((d) => d.id);

      // Delete votes first
      if (existingIds.length > 0) {
        const { error: votesError } = await supabase
          .from("votes")
          .delete()
          .in("poll_date_id", existingIds);

        if (votesError) throw new Error(`Error deleting votes: ${votesError.message}`);

        const { error: datesError } = await supabase
          .from("poll_dates")
          .delete()
          .eq("poll_id", poll.id);

        if (datesError) throw new Error(`Error deleting dates: ${datesError.message}`);
      }

      // Insert new Mon–Fri
      const weekdays = getWeekdays(selectedMonday);
      const rowsToInsert = weekdays.map((day) => ({
        poll_id: poll.id,
        weekday_name: day.weekday_name,
        poll_date: day.poll_date,
      }));

      const { error: insertError } = await supabase
        .from("poll_dates")
        .insert(rowsToInsert);

      if (insertError) throw new Error(`Error inserting dates: ${insertError.message}`);

      showMessage(`Poll reset for week of ${formatMonday(selectedMonday)}.`, "success");
      router.refresh();
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Something went wrong.", "error");
    } finally {
      setIsResettingPoll(false);
    }
  }

  return (
    <div className="border rounded-xl p-6 space-y-8">

      {/* Reset Votes */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Reset Votes</h2>
        <p className="text-sm text-gray-400">
          Clears all votes but keeps the poll dates intact.
        </p>
        <button
          onClick={handleResetVotes}
          disabled={isResettingVotes || !poll}
          className="rounded-lg border border-yellow-500 text-yellow-500 px-4 py-2 font-medium hover:bg-yellow-500 hover:text-black transition disabled:opacity-50"
        >
          {isResettingVotes ? "Clearing..." : "Reset votes"}
        </button>
      </div>

      <hr className="border-gray-700" />

      {/* Reset Poll */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Reset Poll</h2>
        <p className="text-sm text-gray-400">
          Clears all votes & dates, then creates Mon–Fri for the selected week.
        </p>

        <div className="space-y-1">
          <label className="block text-sm font-medium">Select week starting Monday</label>
          <select
            value={selectedMonday.toISOString()}
            onChange={(e) => setSelectedMonday(new Date(e.target.value))}
            className="w-full rounded-lg border px-3 py-2 bg-transparent"
          >
            {mondays.map((monday) => (
              <option key={monday.toISOString()} value={monday.toISOString()}>
                {formatMonday(monday)}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-400 space-y-1">
          <p className="font-medium text-gray-300">Dates to be created:</p>
          <ul className="list-disc list-inside">
            {getWeekdays(selectedMonday).map((d) => (
              <li key={d.poll_date}>{d.weekday_name} — {d.poll_date}</li>
            ))}
          </ul>
        </div>

        <button
          onClick={handleResetPoll}
          disabled={isResettingPoll || !poll}
          className="rounded-lg border border-red-500 text-red-500 px-4 py-2 font-medium hover:bg-red-500 hover:text-black transition disabled:opacity-50"
        >
          {isResettingPoll ? "Resetting..." : "Reset poll"}
        </button>
      </div>

      {message && (
        <p className={`text-sm ${messageType === "error" ? "text-red-400" : "text-green-400"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
