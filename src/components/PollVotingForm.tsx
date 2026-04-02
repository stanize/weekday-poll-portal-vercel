"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type PollDate = {
  id: string;
  weekday_name: string;
  poll_date: string;
  vote_count: number;
  voter_names: string[];
};

type PollVotingFormProps = {
  pollId: string;
  pollDates: PollDate[];
};

function formatPollDate(dateString: string) {
  const date = new Date(dateString);
  const dayNumber = date.getDate();
  const monthName = date.toLocaleDateString("en-GB", { month: "long" });
  let suffix = "th";
  if (dayNumber % 10 === 1 && dayNumber !== 11) suffix = "st";
  else if (dayNumber % 10 === 2 && dayNumber !== 12) suffix = "nd";
  else if (dayNumber % 10 === 3 && dayNumber !== 13) suffix = "rd";
  return `${dayNumber}${suffix} ${monthName}`;
}

function getSessionToken() {
  const storageKey = "weekday_poll_session_token";
  let token = localStorage.getItem(storageKey);

  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(storageKey, token);
  }

  return token;
}

export default function PollVotingForm({ pollId, pollDates }: PollVotingFormProps) {
  const router = useRouter();
  const [selectedDateIds, setSelectedDateIds] = useState<string[]>([]);
  const [voterName, setVoterName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const allPollDateIds = pollDates.map((d) => d.id);

  function toggleDate(dateId: string) {
    setSelectedDateIds((current) =>
      current.includes(dateId)
        ? current.filter((id) => id !== dateId)
        : [...current, dateId]
    );
  }

  function handleNameChange(name: string) {
    setVoterName(name);
    setMessage("");

    const trimmed = name.trim().toLowerCase();
    const existingDates = pollDates
      .filter((d) =>
        (d.voter_names ?? []).some((v) => v.toLowerCase() === trimmed)
      )
      .map((d) => d.id);

    if (existingDates.length > 0) {
      setSelectedDateIds(existingDates);
      setIsUpdating(true);
    } else {
      setSelectedDateIds([]);
      setIsUpdating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!voterName.trim()) {
      setMessage("Please enter your name.");
      return;
    }

    if (selectedDateIds.length === 0) {
      setMessage("Please select at least one date.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isUpdating) {
        // Delete all existing votes for this name across all dates in this poll
        const { error: deleteError } = await supabase
          .from("votes")
          .delete()
          .eq("poll_id", pollId)
          .eq("voter_name", voterName.trim())
          .in("poll_date_id", allPollDateIds);

        if (deleteError) {
          setMessage(`Error updating votes: ${deleteError.message}`);
          return;
        }
      }

      const rowsToInsert = selectedDateIds.map((pollDateId) => ({
        poll_id: pollId,
        poll_date_id: pollDateId,
        voter_name: voterName.trim(),
        session_token: getSessionToken(),
      }));

      const { error: insertError } = await supabase.from("votes").insert(rowsToInsert);

      if (insertError) {
        setMessage(`Error submitting vote: ${insertError.message}`);
      } else {
        setMessage(isUpdating ? "Votes updated successfully." : "Vote submitted successfully.");
        setSelectedDateIds([]);
        setVoterName("");
        setIsUpdating(false);
        router.refresh();
      }
    } catch (err) {
    setMessage(`Something went wrong: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const maxVotes = Math.max(...pollDates.map((d) => d.vote_count), 0);
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ul className="space-y-3">
        {pollDates.map((date) => (
            <li key={date.id} className="border rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
                <input
                type="checkbox"
                checked={selectedDateIds.includes(date.id)}
                onChange={() => toggleDate(date.id)}
                className="h-4 w-4 shrink-0"
                />
                <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                <span className="font-medium">
                    {date.weekday_name}, {formatPollDate(date.poll_date)}
                </span>
                {(date.voter_names ?? []).length > 0 && (
                    <span className="text-sm text-gray-400">
                    ({(date.voter_names ?? []).join(", ")})
                    </span>
                )}
                </label>
                <span className="text-sm text-gray-400 whitespace-nowrap shrink-0">
                {date.vote_count} vote{date.vote_count === 1 ? "" : "s"}
                </span>
            </div>

            {maxVotes > 0 && (
                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-800">
                <div
                    className="h-1.5 rounded-full bg-green-500 transition-all duration-500"
                    style={{ width: `${(date.vote_count / maxVotes) * 100}%` }}
                />
                </div>
            )}
            </li>
        ))}
      </ul>

      <div className="space-y-2">
        <label htmlFor="voterName" className="block text-sm font-medium">
          Name (Required)
        </label>
        <input
          id="voterName"
          type="text"
          value={voterName}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 bg-transparent"
          placeholder="Your name"
          required
        />
        {isUpdating && (
          <p className="text-sm text-yellow-400">
            Existing votes found — editing will replace them.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg border px-4 py-2 font-medium hover:bg-white hover:text-black transition disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : isUpdating ? "Update votes" : "Submit vote"}
      </button>

      {message && <p className="text-sm text-gray-300">{message}</p>}
    </form>
  );
}