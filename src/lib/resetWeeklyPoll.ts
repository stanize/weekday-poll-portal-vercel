import { supabase } from "@/lib/supabase/client";

type PollDateRow = {
  id: string;
  poll_date: string;
};

function getWeekdays(monday: Date) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  return days.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const poll_date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { weekday_name: name, poll_date };
  });
}

function addDays(dateStr: string, days: number): Date {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d;
}

// Fallback only — used if there's no existing "next" week to promote
// (e.g. before the migration/backfill has ever run).
function getUpcomingMonday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = today.getDay();
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7 || 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysUntilMonday);
  return monday;
}

/**
 * Weekly rollover for the morningmeeples poll (runs via Vercel cron every
 * Friday 11am):
 *   1. Deletes the outgoing "current" week's dates + votes.
 *   2. Promotes the "next" week's dates (and its votes, untouched) to "current".
 *   3. Generates a fresh, empty "next" week one week after the newly-promoted one.
 */
export async function resetWeeklyPoll() {
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("id")
    .eq("slug", "morningmeeples")
    .single();

  if (pollError || !poll) throw new Error("morningmeeples poll not found");

  const { data: allDates, error: fetchError } = await supabase
    .from("poll_dates")
    .select("id, poll_date, week_type")
    .eq("poll_id", poll.id);

  if (fetchError) throw new Error(`Error fetching poll dates: ${fetchError.message}`);

  const currentRows = (allDates ?? []).filter((d) => d.week_type === "current") as PollDateRow[];
  const nextRows = (allDates ?? []).filter((d) => d.week_type === "next") as PollDateRow[];

  // 1. Delete the outgoing current week (dates + votes) — it's being replaced.
  const currentIds = currentRows.map((d) => d.id);
  if (currentIds.length > 0) {
    const { error: votesError } = await supabase
      .from("votes")
      .delete()
      .in("poll_date_id", currentIds);
    if (votesError) throw new Error(`Error deleting old current-week votes: ${votesError.message}`);

    const { error: deleteError } = await supabase
      .from("poll_dates")
      .delete()
      .in("id", currentIds);
    if (deleteError) throw new Error(`Error deleting old current-week dates: ${deleteError.message}`);
  }

  // 2. Promote next week -> current. Its votes stay attached (poll_date_id
  //    is unchanged), so they carry over as-is.
  const nextIds = nextRows.map((d) => d.id);
  if (nextIds.length > 0) {
    const { error: promoteError } = await supabase
      .from("poll_dates")
      .update({ week_type: "current" })
      .in("id", nextIds);
    if (promoteError) throw new Error(`Error promoting next week to current: ${promoteError.message}`);
  }

  // 3. Generate a fresh, empty week for the new "next" — one week after
  //    whichever week just got promoted.
  const sortedNext = [...nextRows].sort((a, b) => a.poll_date.localeCompare(b.poll_date));
  const newNextMonday =
    sortedNext.length > 0 ? addDays(sortedNext[0].poll_date, 7) : getUpcomingMonday();

  const newNextRows = getWeekdays(newNextMonday).map((d) => ({
    poll_id: poll.id,
    week_type: "next" as const,
    ...d,
  }));

  const { error: insertError } = await supabase.from("poll_dates").insert(newNextRows);
  if (insertError) throw new Error(`Error inserting new next-week dates: ${insertError.message}`);

  return {
    promotedToCurrentWeekOf: sortedNext[0]?.poll_date ?? null,
    newNextWeekOf: newNextMonday.toISOString().slice(0, 10),
  };
}
