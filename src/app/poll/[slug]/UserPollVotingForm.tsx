"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type UserPollDate = {
  id: string;
  weekday_name: string;
  poll_date: string;
  time_slot: string | null;
  vote_count: number;
  voter_names: string[];
};

type UserPollVotingFormProps = {
  pollId: string;
  pollDates: UserPollDate[];
};

function formatPollDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const dayNumber = date.getDate();
  const monthName = date.toLocaleDateString("en-GB", { month: "long" });
  let suffix = "th";
  if (dayNumber % 10 === 1 && dayNumber !== 11) suffix = "st";
  else if (dayNumber % 10 === 2 && dayNumber !== 12) suffix = "nd";
  else if (dayNumber % 10 === 3 && dayNumber !== 13) suffix = "rd";
  return `${dayNumber}${suffix} ${monthName}`;
}

function getSessionToken() {
  const storageKey = "user_poll_session_token";
  let token = localStorage.getItem(storageKey);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(storageKey, token);
  }
  return token;
}

// ── Calendar helpers ───────────────────────────────────────────────────────────

function groupByMonth(dates: UserPollDate[]): [string, UserPollDate[]][] {
  const map: Record<string, UserPollDate[]> = {};
  for (const d of dates) {
    const key = d.poll_date.slice(0, 7);
    if (!map[key]) map[key] = [];
    map[key].push(d);
  }
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
}

function buildMonthCells(yearMonth: string): (number | null)[] {
  const [year, month] = yearMonth.split("-").map(Number);
  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = Array<null>(firstDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const DOW_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type CalendarViewProps = {
  pollDates: UserPollDate[];
  selectedDateIds: string[];
  hasName: boolean;
  onDateClick: (id: string) => void;
};

function CalendarView({ pollDates, selectedDateIds, hasName, onDateClick }: CalendarViewProps) {
  const dateByYMD = Object.fromEntries(pollDates.map((d) => [d.poll_date, d]));
  const months = groupByMonth(pollDates);

  return (
    <div className="space-y-6">
      {months.map(([yearMonth]) => {
        const [year, month] = yearMonth.split("-").map(Number);
        const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
          month: "long",
          year: "numeric",
        });
        const cells = buildMonthCells(yearMonth);

        return (
          <div key={yearMonth}>
            <p className="text-sm font-medium mb-2">{monthLabel}</p>
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {DOW_LABELS.map((d) => (
                <div key={d} className="text-xs text-gray-500 pb-1">
                  {d}
                </div>
              ))}
              {cells.map((day, idx) => {
                if (!day) return <div key={idx} />;

                const ymd = `${yearMonth}-${String(day).padStart(2, "0")}`;
                const pollDate = dateByYMD[ymd];

                if (!pollDate) {
                  return (
                    <div key={idx} className="py-2 text-gray-700">
                      {day}
                    </div>
                  );
                }

                const isSelected = selectedDateIds.includes(pollDate.id);
                const tooltipParts = [
                  pollDate.time_slot,
                  pollDate.voter_names.length > 0
                    ? `Voters: ${pollDate.voter_names.join(", ")}`
                    : null,
                ].filter(Boolean);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onDateClick(pollDate.id)}
                    title={tooltipParts.length > 0 ? tooltipParts.join(" · ") : undefined}
                    className={`relative block rounded font-medium transition min-h-10 p-1 ${
                      !hasName
                        ? "border opacity-40 cursor-not-allowed"
                        : isSelected
                        ? "bg-white text-black"
                        : "border hover:bg-white hover:text-black"
                    }`}
                  >
                    <span className="block text-center">{day}</span>
                    {pollDate.vote_count > 0 && (
                      <span className="absolute bottom-0.5 left-0.5 inline-flex items-center bg-green-600 text-white text-[9px] leading-none px-1 py-0.5 rounded font-normal">
                        {pollDate.vote_count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function UserPollVotingForm({ pollId, pollDates }: UserPollVotingFormProps) {
  const router = useRouter();
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [selectedDateIds, setSelectedDateIds] = useState<string[]>([]);
  const [voterName, setVoterName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [namePromptVisible, setNamePromptVisible] = useState(false);
  const [topN, setTopN] = useState<number | "all">(5);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const allPollDateIds = pollDates.map((d) => d.id);
  const useCalendarView = pollDates.length > 5;
  const hasName = voterName.trim().length > 0;

  // Dates with votes, sorted by vote count desc — derived from server-rendered prop
  const datesWithVotes = [...pollDates]
    .filter((d) => d.vote_count > 0)
    .sort((a, b) => b.vote_count - a.vote_count);
  const topChoices =
    topN === "all" ? datesWithVotes : datesWithVotes.slice(0, topN as number);

  function toggleDate(dateId: string) {
    setSelectedDateIds((current) =>
      current.includes(dateId)
        ? current.filter((id) => id !== dateId)
        : [...current, dateId]
    );
  }

  function handleDateClick(dateId: string) {
    if (!hasName) {
      setNamePromptVisible(true);
      nameInputRef.current?.focus();
      return;
    }
    setNamePromptVisible(false);
    toggleDate(dateId);
  }

  function handleNameChange(name: string) {
    setVoterName(name);
    setMessage("");
    if (name.trim()) setNamePromptVisible(false);

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
      setNamePromptVisible(true);
      nameInputRef.current?.focus();
      return;
    }

    if (selectedDateIds.length === 0) {
      setMessage("Please select at least one date.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: deleteError } = await supabase
        .from("user_votes")
        .delete()
        .eq("poll_id", pollId)
        .eq("voter_name", voterName.trim());

      if (deleteError) {
        setMessage(`Error updating votes: ${deleteError.message}`);
        return;
      }

      const rowsToInsert = selectedDateIds.map((pollDateId) => ({
        poll_id: pollId,
        poll_date_id: pollDateId,
        voter_name: voterName.trim(),
        session_token: getSessionToken(),
      }));

      const { error: insertError } = await supabase
        .from("user_votes")
        .insert(rowsToInsert);

      if (insertError) {
        setMessage(`Error submitting vote: ${insertError.message}`);
      } else {
        setMessage(
          isUpdating ? "Votes updated successfully." : "Vote submitted successfully."
        );
        setSelectedDateIds([]);
        setVoterName("");
        setIsUpdating(false);
        router.refresh();
      }
    } catch (err) {
      setMessage(
        `Something went wrong: ${err instanceof Error ? err.message : JSON.stringify(err)}`
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const maxVotes = Math.max(...pollDates.map((d) => d.vote_count), 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name input — always at the top */}
      <div className="space-y-1">
        <label htmlFor="voterName" className="block text-sm font-medium">
          Name (Required)
        </label>
        <input
          ref={nameInputRef}
          id="voterName"
          type="text"
          value={voterName}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 bg-transparent"
          placeholder="Your name"
          required
        />
        {namePromptVisible && !hasName && (
          <p className="text-sm text-amber-400">Please enter your name first.</p>
        )}
        {isUpdating && (
          <p className="text-sm text-yellow-400">
            Existing votes found — editing will replace them.
          </p>
        )}
      </div>

      {/* Date selection */}
      {useCalendarView ? (
        <>
          <CalendarView
            pollDates={pollDates}
            selectedDateIds={selectedDateIds}
            hasName={hasName}
            onDateClick={handleDateClick}
          />
          {selectedDateIds.length > 0 && (
            <p className="text-xs text-gray-400">
              {selectedDateIds.length} date
              {selectedDateIds.length === 1 ? "" : "s"} selected
            </p>
          )}
        </>
      ) : (
        <ul className="space-y-3">
          {pollDates.map((date) => (
            <li key={date.id} className="border rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedDateIds.includes(date.id)}
                  onChange={() => handleDateClick(date.id)}
                  className={`h-4 w-4 shrink-0 ${
                    !hasName ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                  }`}
                />
                <label
                  className={`flex items-center gap-2 flex-1 min-w-0 ${
                    !hasName ? "opacity-40" : "cursor-pointer"
                  }`}
                >
                  <span className="font-medium">
                    {date.weekday_name}, {formatPollDate(date.poll_date)}
                    {date.time_slot && (
                      <span className="text-gray-400 font-normal">
                        {" "}— {date.time_slot}
                      </span>
                    )}
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
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg border px-4 py-2 font-medium hover:bg-white hover:text-black transition disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : isUpdating ? "Update votes" : "Submit vote"}
      </button>

      {message && <p className="text-sm text-gray-300">{message}</p>}

      {/* Top Choices */}
      <div className="space-y-3 pt-4 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Top Choices</p>
          <select
            value={topN === "all" ? "all" : String(topN)}
            onChange={(e) =>
              setTopN(e.target.value === "all" ? "all" : Number(e.target.value))
            }
            className="text-sm rounded-lg border px-2 py-1 bg-transparent"
          >
            <option value="3">Top 3</option>
            <option value="5">Top 5</option>
            <option value="10">Top 10</option>
            <option value="all">All</option>
          </select>
        </div>

        {topChoices.length === 0 ? (
          <p className="text-sm text-gray-500">No votes yet — be the first!</p>
        ) : (
          <ol className="space-y-2">
            {topChoices.map((date, i) => (
              <li key={date.id} className="flex items-start gap-3">
                <span className="text-xs text-gray-600 w-4 shrink-0 mt-0.5">
                  {i + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {date.weekday_name}, {formatPollDate(date.poll_date)}
                    {date.time_slot && (
                      <span className="text-gray-400 font-normal">
                        {" "}— {date.time_slot}
                      </span>
                    )}
                  </p>
                  {date.voter_names.length > 0 && (
                    <p className="text-xs text-gray-500 truncate">
                      {date.voter_names.join(", ")}
                    </p>
                  )}
                </div>
                <span className="text-sm text-gray-400 whitespace-nowrap shrink-0">
                  {date.vote_count} vote{date.vote_count === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </form>
  );
}
